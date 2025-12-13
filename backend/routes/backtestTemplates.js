const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const BacktestTemplate = require('../models/BacktestTemplate');

const router = express.Router();

// Validation rules
const templateValidation = [
  body('name').trim().notEmpty().withMessage('Template name is required').isLength({ max: 200 }),
  body('description').optional().trim().isLength({ max: 1000 }),
  body('category').isIn(['swing', 'scalping', 'breakout', 'reversal', 'trend-following', 'custom'])
];

// GET /api/backtest-templates - Get all templates for a user
router.get('/', async (req, res) => {
  try {
    const { userId, category } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const query = { 
      userId: new mongoose.Types.ObjectId(userId),
      isActive: true 
    };
    
    if (category && category !== 'all') {
      query.category = category;
    }

    const templates = await BacktestTemplate.find(query)
      .sort({ usageCount: -1, createdAt: -1 });

    res.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ success: false, message: 'Error fetching templates', error: error.message });
  }
});

// GET /api/backtest-templates/:id - Get specific template
router.get('/:id', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const template = await BacktestTemplate.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error fetching template:', error);
    res.status(500).json({ success: false, message: 'Error fetching template', error: error.message });
  }
});

// POST /api/backtest-templates - Create new template
router.post('/', templateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId, name, description, category, templateData, isDefault } = req.body;

    // Clean templateData - remove empty string values
    const cleanedTemplateData = {};
    if (templateData && typeof templateData === 'object') {
      Object.keys(templateData).forEach(key => {
        const value = templateData[key];
        // Only include non-empty values
        if (value !== '' && value !== null && value !== undefined) {
          cleanedTemplateData[key] = value;
        }
      });
    }

    // If setting as default, remove default from other templates
    if (isDefault) {
      await BacktestTemplate.updateMany(
        { userId: new mongoose.Types.ObjectId(userId), isDefault: true },
        { isDefault: false }
      );
    }

    const template = new BacktestTemplate({
      userId: new mongoose.Types.ObjectId(userId),
      name,
      description,
      category: category || 'custom',
      templateData: cleanedTemplateData,
      isDefault: isDefault || false,
      isActive: true,
      usageCount: 0
    });

    await template.save();

    res.status(201).json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(500).json({ success: false, message: 'Error creating template', error: error.message });
  }
});

// PUT /api/backtest-templates/:id - Update template
router.put('/:id', templateValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { userId, name, description, category, templateData, isDefault } = req.body;

    const template = await BacktestTemplate.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    // Clean templateData - remove empty string values
    let cleanedTemplateData = template.templateData;
    if (templateData && typeof templateData === 'object') {
      cleanedTemplateData = {};
      Object.keys(templateData).forEach(key => {
        const value = templateData[key];
        // Only include non-empty values
        if (value !== '' && value !== null && value !== undefined) {
          cleanedTemplateData[key] = value;
        }
      });
    }

    // If setting as default, remove default from other templates
    if (isDefault && !template.isDefault) {
      await BacktestTemplate.updateMany(
        { 
          userId: new mongoose.Types.ObjectId(userId), 
          isDefault: true,
          _id: { $ne: template._id }
        },
        { isDefault: false }
      );
    }

    template.name = name || template.name;
    template.description = description !== undefined ? description : template.description;
    template.category = category || template.category;
    template.templateData = cleanedTemplateData;
    template.isDefault = isDefault !== undefined ? isDefault : template.isDefault;

    await template.save();

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(500).json({ success: false, message: 'Error updating template', error: error.message });
  }
});

// DELETE /api/backtest-templates/:id - Delete template
router.delete('/:id', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const template = await BacktestTemplate.findOneAndDelete({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    res.json({
      success: true,
      message: 'Template deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting template:', error);
    res.status(500).json({ success: false, message: 'Error deleting template', error: error.message });
  }
});

// POST /api/backtest-templates/:id/use - Increment usage count
router.post('/:id/use', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'User ID is required' });
    }

    const template = await BacktestTemplate.findOne({
      _id: req.params.id,
      userId: new mongoose.Types.ObjectId(userId)
    });

    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    await template.incrementUsage();

    res.json({
      success: true,
      template
    });
  } catch (error) {
    console.error('Error updating template usage:', error);
    res.status(500).json({ success: false, message: 'Error updating usage', error: error.message });
  }
});

module.exports = router;

