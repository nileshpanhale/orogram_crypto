const multer = require('multer');
var { uploadImagePath } = require('./vars');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        
        cb(null, uploadImagePath);
    },
    filename: function (req, file, cb) {
        // console.log("2222222222222", file)
        file.originalname = file.originalname.split(" ").join("_");
        cb(null, req.user._id + '_' + new Date().getTime() + '_' + file.originalname);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg'
        || file.mimetype === 'application/pdf' || file.mimetype === 'application/PDF' || file.mimetype === 'application/msword'
        || file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        || file.mimetype === 'application/vnd.oasis.opendocument.spreadsheet' || file.mimetype === 'text/csv'
        || file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        cb(null, true);
    } else { // reject a file
        cb(null, false);
    }
};

const fileUploadConfig = multer({
    storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 5 // max file size 5mb
    },
    fileFilter: fileFilter
});

module.exports = fileUploadConfig;