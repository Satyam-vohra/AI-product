import express from 'express';
import ImageService from '../services/image-service';

const router = express.Router();

router.post('/diagnose-image-url', async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: 'imageUrl is required',
      });
    }

    const result = await ImageService.diagnoseImageFromUrl(imageUrl);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
