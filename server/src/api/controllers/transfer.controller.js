const WireTransfer = require('../models/wireTransfer.model');

exports.saveWireTransfer = async (req, res, next) => {
  try {
  	const wireTransfer = await (new WireTransfer(req.body)).save();
    return res.send(wireTransfer);
  } catch (err) {
    return next(err);
  }
}

exports.list = async (req, res, next) => {
  try {
    const wireTransfer = await WireTransfer.list(req.query);
    res.json(wireTransfer);
  } catch (error) {
    next(error);
  }
};
