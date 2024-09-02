const express = require('express');
const multer = require('multer');
const { Storage } = require('@google-cloud/storage');
const sharp = require('sharp');
const Business = require('../models/Business');
const fs = require('fs'); // Import the fs module
const path = require('path');
const { formatDateForFilename } = require('../utils/dateUtils');
const Rating = require('../models/Rating');
const User = require('../models/User');
const { updateRating } = require('./rating');

const router = express.Router();
const upload = multer({ dest: 'uploads/' }); // Temporary storage before uploading to Google Cloud Storage

// Initialize Google Cloud Storage
const storage = new Storage({ keyFilename: "./gcs-crud.json" });
const bucket = storage.bucket('around-photos');
const google_photos_domain = 'https://storage.googleapis.com';

// Endpoint to create a new business
router.post('/new', upload.fields([{ name: 'logoFile', maxCount: 1 }, { name: 'galleryFile', maxCount: 10 }]), async (req, res) => {
    try {
        const { user_id, city, category, name, owner, email, mobile, service, address } = req.body;

        // Step 1: Create a new instance of the Business model to generate the _id
        const dummyBusiness = new Business({ user_id, city, category, name, owner, email, mobile, address });
        const businessId = dummyBusiness._id; // Extract the generated _id without saving

        const uploadPromises = [];
        let logoUrl = null;
        let logoThumbnailUrl = null;
        const galleryUrls = [];
        const galleryThumbnailUrls = [];
        const timestamp = formatDateForFilename();

        // Step 2: Upload logo and create thumbnail
        if (req.files.logoFile) {
            const logoFile = req.files.logoFile[0];
            const logoBlob = bucket.file(`${user_id}/${businessId}/logo-${timestamp}-${logoFile.originalname}`);
            const logoThumbnailBlob = bucket.file(`${user_id}/${businessId}/thumbnail-logo-${timestamp}-${logoFile.originalname}`);

            // Upload the original logo
            const uploadLogo = fs.promises.readFile(logoFile.path)
                .then(data => logoBlob.save(data, { resumable: false }))
                .then(() => {
                    logoUrl = `${google_photos_domain}/${bucket.name}/${logoBlob.name}`;
                });

            // Create and upload the thumbnail
            const uploadLogoThumbnail = sharp(logoFile.path)
                .resize(50, 50) // Resize to thumbnail dimensions
                .toBuffer()
                .then(data => logoThumbnailBlob.save(data, { contentType: 'image/jpeg', resumable: false }))
                .then(() => {
                    logoThumbnailUrl = `${google_photos_domain}/${bucket.name}/${logoThumbnailBlob.name}`;
                });

            uploadPromises.push(uploadLogo, uploadLogoThumbnail);
        }

        // Step 3: Upload gallery images and create thumbnails
        if (req.files.galleryFile) {
            req.files.galleryFile.forEach((image) => {
                const galleryBlob = bucket.file(`${user_id}/${businessId}/gallery-${timestamp}-${image.originalname}`);
                const galleryThumbnailBlob = bucket.file(`${user_id}/${businessId}/thumbnail-gallery-${timestamp}-${image.originalname}`);

                // Upload the original gallery image
                const uploadGallery = fs.promises.readFile(image.path)
                    .then(data => galleryBlob.save(data, { resumable: false }))
                    .then(() => {
                        galleryUrls.push(`${google_photos_domain}/${bucket.name}/${galleryBlob.name}`);
                    });

                // Create and upload the thumbnail
                const uploadGalleryThumbnail = sharp(image.path)
                    .resize(150, 150) // Resize to thumbnail dimensions
                    .toBuffer()
                    .then(data => galleryThumbnailBlob.save(data, { contentType: 'image/jpeg', resumable: false }))
                    .then(() => {
                        galleryThumbnailUrls.push(`${google_photos_domain}/${bucket.name}/${galleryThumbnailBlob.name}`);
                    });

                uploadPromises.push(uploadGallery, uploadGalleryThumbnail);
            });
        }

        await Promise.all(uploadPromises);

        // Step 4: Delete temporary files after uploads
        Object.values(req.files).flat().forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) {
                    console.error(`Failed to delete temporary file: ${file.path}`, err);
                } else {
                    console.log(`Successfully deleted temporary file: ${file.path}`);
                }
            });
        });

        // Step 5: Update the business with the full details and file URLs
        const businessData = {
            _id: businessId,
            user_id,
            city,
            category,
            name,
            owner,
            email,
            mobile,
            service: service ? service.split(',') : [], // Convert comma-separated string to array
            address,
            logo: logoUrl,
            logoThumbnail: logoThumbnailUrl,
            gallery: galleryUrls,
            galleryThumbnails: galleryThumbnailUrls,
        };

        const newBusiness = new Business(businessData);
        await newBusiness.save(); // Save the business with the full data

        res.status(200).json({ message: 'Business details added successfully!', businessId });

    } catch (error) {
        console.error('Error uploading files to GCS:', error);
        res.status(500).json({ message: 'An error occurred while adding/updating business details.' });
    }
});

// Endpoint to read/search an existing business
router.post('/search', async (req, res) => {
    const { page = 1, limit = 10, filter = {}, projection = {}, sortBy = {} } = req.body;

    try {
        // Enforce a maximum limit of 10 documents per request
        const enforcedLimit = Math.min(parseInt(limit, 10), 10);

        // Calculate the number of documents to skip for pagination
        const skip = (page - 1) * enforcedLimit;

        // Query to find documents, sorted and paginated
        const documents = await Business.find(filter, projection)
            .sort(sortBy)
            .skip(skip)
            .limit(parseInt(enforcedLimit, 10)); // Ensure limit is parsed as an integer

        // Count total documents for the filter
        const totalDocuments = await Business.countDocuments(filter);

        // Send response with documents and pagination info
        res.status(200).json({
            totalPages: Math.ceil(totalDocuments / enforcedLimit),
            currentPage: parseInt(page, 10), // Ensure limit is parsed as an integer
            documents,
        });
    } catch (error) {
        console.error(`Error searching business, error:`, error.message);
        res.status(500).json({ error: error.message });
    }
});

// Endpoint to update an existing business
router.put('/update/:businessId', upload.fields([{ name: 'logoFile', maxCount: 1 }, { name: 'galleryFile', maxCount: 10 }]), async (req, res) => {
    try {
        const { businessId } = req.params;
        const { city, category, name, owner, email, mobile, service, address, logoUrl, galleryUrl } = req.body;

        // Step 1: Fetch the existing business
        let existingBusiness = await Business.findById(businessId);
        if (!existingBusiness) {
            return res.status(404).json({ message: 'Business not found' });
        }

        // Step 2: Identify the old images and thumbnails to delete
        const logoToDelete = existingBusiness.logo && existingBusiness.logo !== logoUrl ? existingBusiness.logo : null;
        const logoThumbnailToDelete = existingBusiness.logoThumbnail && existingBusiness.logo !== logoUrl ? existingBusiness.logoThumbnail : null;
        let galleryToDelete = null;
        let galleryThumbnailsToDelete = null;
        if (galleryUrl) {
            galleryToDelete = existingBusiness.gallery.filter(url => !galleryUrl.includes(url));
            galleryThumbnailsToDelete = existingBusiness.galleryThumbnails.filter(thumbUrl => !galleryUrl.includes(thumbUrl.replace('thumbnail-', '')));
        } else {
            galleryToDelete = existingBusiness.gallery;
            galleryThumbnailsToDelete = existingBusiness.galleryThumbnails;
        }

        // Step 3: Delete the old images and thumbnails from Google Cloud Storage
        const deletePromises = [];

        if (logoToDelete) {
            const oldLogoFile = bucket.file(logoToDelete.replace(`${google_photos_domain}/${bucket.name}/`, ''));
            deletePromises.push(oldLogoFile.delete());

            if (logoThumbnailToDelete) {
                const oldLogoThumbnailFile = bucket.file(logoThumbnailToDelete.replace(`${google_photos_domain}/${bucket.name}/`, ''));
                deletePromises.push(oldLogoThumbnailFile.delete());
            }
        }

        if (galleryToDelete.length > 0) {
            galleryToDelete.forEach(galleryUrl => {
                const oldGalleryFile = bucket.file(galleryUrl.replace(`${google_photos_domain}/${bucket.name}/`, ''));
                deletePromises.push(oldGalleryFile.delete());
            });
        }

        if (galleryThumbnailsToDelete.length > 0) {
            galleryThumbnailsToDelete.forEach(galleryThumbnailUrl => {
                const oldGalleryThumbnailFile = bucket.file(galleryThumbnailUrl.replace(`${google_photos_domain}/${bucket.name}/`, ''));
                deletePromises.push(oldGalleryThumbnailFile.delete());
            });
        }

        await Promise.all(deletePromises);

        // Step 4: Handle the new logo and new gallery images (if provided as a file)
        const uploadPromises = [];
        let newLogoUrl = logoUrl ? existingBusiness.logo === logoUrl ? existingBusiness.logo : null : null;
        let newLogoThumbnailUrl = logoUrl ? existingBusiness.logo === logoUrl ? existingBusiness.logoThumbnail : null : null;
        const newGalleryUrls = galleryUrl ? Array.isArray(galleryUrl) ? galleryUrl : [galleryUrl] : [];
        const newGalleryThumbnailUrls = existingBusiness.galleryThumbnails.filter(thumbUrl => newGalleryUrls.includes(thumbUrl.replace('thumbnail-', '')));
        const timestamp = formatDateForFilename();

        // Step 5: Upload logo and create thumbnail
        if (req.files.logoFile) {
            const logoFile = req.files.logoFile[0];
            const logoBlob = bucket.file(`${existingBusiness.user_id}/${businessId}/logo-${timestamp}-${logoFile.originalname}`);
            const logoThumbnailBlob = bucket.file(`${existingBusiness.user_id}/${businessId}/thumbnail-logo-${timestamp}-${logoFile.originalname}`);

            // Upload the original logo
            const uploadLogo = fs.promises.readFile(logoFile.path)
                .then(data => logoBlob.save(data, { resumable: false }))
                .then(() => {
                    newLogoUrl = `${google_photos_domain}/${bucket.name}/${logoBlob.name}`;
                });

            // Create and upload the thumbnail
            const uploadLogoThumbnail = sharp(logoFile.path)
                .resize(50, 50) // Resize to thumbnail dimensions
                .toBuffer()
                .then(data => logoThumbnailBlob.save(data, { contentType: 'image/jpeg', resumable: false }))
                .then(() => {
                    newLogoThumbnailUrl = `${google_photos_domain}/${bucket.name}/${logoThumbnailBlob.name}`;
                });

            uploadPromises.push(uploadLogo, uploadLogoThumbnail);
        }

        // Step 6: Upload gallery images and create thumbnails
        if (req.files.galleryFile) {
            req.files.galleryFile.forEach((image) => {
                const galleryBlob = bucket.file(`${existingBusiness.user_id}/${businessId}/gallery-${timestamp}-${image.originalname}`);
                const galleryThumbnailBlob = bucket.file(`${existingBusiness.user_id}/${businessId}/thumbnail-gallery-${timestamp}-${image.originalname}`);

                // Upload the original gallery image
                const uploadGallery = fs.promises.readFile(image.path)
                    .then(data => galleryBlob.save(data, { resumable: false }))
                    .then(() => {
                        newGalleryUrls.push(`${google_photos_domain}/${bucket.name}/${galleryBlob.name}`);
                    });

                // Create and upload the thumbnail
                const uploadGalleryThumbnail = sharp(image.path)
                    .resize(150, 150) // Resize to thumbnail dimensions
                    .toBuffer()
                    .then(data => galleryThumbnailBlob.save(data, { contentType: 'image/jpeg', resumable: false }))
                    .then(() => {
                        newGalleryThumbnailUrls.push(`${google_photos_domain}/${bucket.name}/${galleryThumbnailBlob.name}`);
                    });

                uploadPromises.push(uploadGallery, uploadGalleryThumbnail);
            });
        }

        await Promise.all(uploadPromises);

        // Step 7: Delete temporary files after uploads
        Object.values(req.files).flat().forEach(file => {
            fs.unlink(file.path, (err) => {
                if (err) {
                    console.error(`Failed to delete temporary file: ${file.path}`, err);
                } else {
                    console.log(`Successfully deleted temporary file: ${file.path}`);
                }
            });
        });

        // Step 8: Update the business in the database
        const updatedBusinessData = {
            city,
            category,
            name,
            owner,
            email,
            mobile,
            service: service ? service.split(',') : [], // Convert comma-separated string to array
            address,
            logo: newLogoUrl,
            logoThumbnail: newLogoThumbnailUrl,
            gallery: newGalleryUrls,
            galleryThumbnails: newGalleryThumbnailUrls,
        };

        const updatedBusiness = await Business.findByIdAndUpdate(businessId, updatedBusinessData, { new: true });

        res.status(200).json({ message: 'Business details updated successfully!', updatedBusiness });

    } catch (error) {
        console.error('Error updating business details:', error);
        res.status(500).json({ message: 'An error occurred while updating business details.' });
    }
});

// Endpoint to delete a business
router.delete('/delete/:businessId', async (req, res) => {
    try {
        const { businessId } = req.params;

        // Step 1: Find the business by ID
        const business = await Business.findById(businessId);
        if (!business) {
            return res.status(404).json({ message: 'Business not found.' });
        }

        const { user_id, logo, logoThumbnail, gallery, galleryThumbnails, rating } = business;

        const deletePromises = [];

        // Step 2: Delete logo and logo thumbnail from GCS
        if (logo) {
            const logoBlob = bucket.file(stringUrlToBucketFileName(logo));
            deletePromises.push(logoBlob.delete());
        }

        if (logoThumbnail) {
            const logoThumbnailBlob = bucket.file(stringUrlToBucketFileName(logoThumbnail));
            deletePromises.push(logoThumbnailBlob.delete());
        }

        // Step 3: Delete gallery images and their thumbnails from GCS
        if (gallery && gallery.length > 0) {
            gallery.forEach((url) => {
                const galleryBlob = bucket.file(stringUrlToBucketFileName(url)); // Remove leading '/'
                deletePromises.push(galleryBlob.delete());
            });
        }

        if (galleryThumbnails && galleryThumbnails.length > 0) {
            galleryThumbnails.forEach((url) => {
                const galleryThumbnailBlob = bucket.file(stringUrlToBucketFileName(url)); // Remove leading '/'
                deletePromises.push(galleryThumbnailBlob.delete());
            });
        }

        // Step 4: Wait for all deletion operations to complete
        await Promise.all(deletePromises);

        // Step 5: Delete the business record from the database
        await Business.findByIdAndDelete(businessId);
        await Rating.deleteMany({ business_id: businessId });
        const businessUser = await User.findById(user_id);
        await updateRating(businessUser, -1, -rating);

        res.status(200).json({ message: 'Business deleted successfully.' });

    } catch (error) {
        console.error('Error deleting business:', error);
        res.status(500).json({ message: 'An error occurred while deleting the business.' });
    }
});

const stringUrlToBucketFileName = (stringUrl) => {
    return stringUrl.replace(`${google_photos_domain}/${bucket.name}/`, '');
}

module.exports = router;
