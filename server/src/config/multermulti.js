const multer = require('multer');
var { uploadImagePath } = require('./vars');


const storage = multer.diskStorage({
    destination: function (req, file, cb) {

        cb(null, uploadImagePath);
    },
    filename: function (req, file, cb) {

        cb(null, new Date().getTime() + '_' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'
        || file.mimetype === 'application/pdf' || file.mimetype === 'application/PDF' || file.mimetype === 'application/msword'
        || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else { // reject a file
        cb(null, false);
    }
};

module.exports.fileUploadConfig = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // max file size 5mb
    },
    fileFilter: fileFilter
});




const docFileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'
        || file.mimetype === 'application/pdf' || file.mimetype === 'application/PDF' || file.mimetype === 'application/msword'
        || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        cb(null, true);
    } else { // reject a file
        cb(null, false);
    }
};

module.exports.docUploadConfig = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // max file size 5mb
    },
    fileFilter: docFileFilter
});

// module.exports = fileUploadConfig;
// module.exports = docUploadConfig;