const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const TradeChecklist = require('../models/TradeChecklist');
const TradeChecklistResult = require('../models/TradeChecklistResult');
const Trade = require('../models/Trade');

const router = express.Router();

// Validation rules for checklist creation/update
const checklistValidation = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name must be between 1 and 100 characters'),
  body('description').optional().trim().isLength({ max: 500 }).withMessage('Description must be less than 500 characters'),
  body('category').optional().isIn(['scalping', 'day-trading', 'swing-trading', 'position-trading', 'custom']).withMessage('Invalid category'),
  body('isActive').optional().isBoolean().withMessage('isActive must be a boolean'),
  body('isDefault').optional().isBoolean().withMessage('isDefault must be a boolean'),
  body('instruments').optional().isArray().withMessage('Instruments must be an array'),
  body('strategies').optional().isArray().withMessage('Strategies must be an array'),
  body('items').isArray({ min: 1 }).withMessage('At least one checklist item is required'),
  body('items.*.title').trim().isLength({ min: 1, max: 200 }).withMessage('Item title must be between 1 and 200 characters'),
  body('items.*.description').optional().trim().isLength({ max: 500 }).withMessage('Item description must be less than 500 characters'),
  body('items.*.isRequired').optional().isBoolean().withMessage('isRequired must be a boolean'),
  body('items.*.order').isInt({ min: 1 }).withMessage('Order must be a positive integer'),
  body('items.*.category').optional().isIn(['technical', 'fundamental', 'risk-management', 'psychology', 'execution', 'custom']).withMessage('Invalid item category'),
  body('items.*.inputType').optional().isIn(['checkbox', 'text', 'number', 'select', 'radio']).withMessage('Invalid input type'),
  body('items.*.options').optional().isArray().withMessage('Options must be an array'),
  body('items.*.options.*.label').optional().trim().isLength({ min: 1 }).withMessage('Option label is required'),
  body('items.*.options.*.value').optional().trim().isLength({ min: 1 }).withMessage('Option value is required')
];

// Validation rules for checklist results
const checklistResultValidation = [
  body('tradeId').optional().isMongoId().withMessage('Valid trade ID is required'),
  body('checklistId').isMongoId().withMessage('Valid checklist ID is required'),
  body('items').isArray().withMessage('Items must be an array'),
  body('items.*.itemId').isMongoId().withMessage('Valid item ID is required'),
  body('items.*.isCompleted').isBoolean().withMessage('isCompleted must be a boolean'),
  body('items.*.notes').optional().trim().isLength({ max: 500 }).withMessage('Notes must be less than 500 characters'),
  body('overallNotes').optional().trim().isLength({ max: 1000 }).withMessage('Overall notes must be less than 1000 characters'),
  body('qualityScore').optional().isInt({ min: 1, max: 10 }).withMessage('Quality score must be between 1 and 10')
];

// GET /api/checklists - Get all checklists for a user
router.get('/', async (req, res) => {
  try {
    const { userId, category, isActive, isDefault } = req.query;
    
    const filter = {};
    if (userId) filter.userId = new mongoose.Types.ObjectId(userId);
    if (category) filter.category = category;
    if (typeof isActive === 'boolean') filter.isActive = isActive;
    if (typeof isDefault === 'boolean') filter.isDefault = isDefault;

    const checklists = await TradeChecklist.find(filter)
      .populate('userId', 'name email')
      .sort({ name: 1 });

    res.json({ checklists });
  } catch (error) {
    console.error('Error fetching checklists:', error);
    res.status(500).json({ message: 'Error fetching checklists', error: error.message });
  }
});

// GET /api/checklists/default - Get default checklist for user
router.get('/default', async (req, res) => {
  try {
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const checklist = await TradeChecklist.getDefaultChecklist(userId);
    
    if (!checklist) {
      return res.status(404).json({ message: 'No default checklist found' });
    }

    res.json({ checklist });
  } catch (error) {
    console.error('Error fetching default checklist:', error);
    res.status(500).json({ message: 'Error fetching default checklist', error: error.message });
  }
});

// GET /api/checklists/:id - Get single checklist by ID
router.get('/:id', async (req, res) => {
  try {
    const checklist = await TradeChecklist.findById(req.params.id)
      .populate('userId', 'name email');
    
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    res.json({ checklist });
  } catch (error) {
    console.error('Error fetching checklist:', error);
    res.status(500).json({ message: 'Error fetching checklist', error: error.message });
  }
});

// POST /api/checklists - Create new checklist
router.post('/', checklistValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      userId,
      name,
      description,
      category,
      isActive,
      isDefault,
      instruments,
      strategies,
      items
    } = req.body;

    // If setting as default, unset other default checklists for this user
    if (isDefault) {
      await TradeChecklist.updateMany(
        { userId, isDefault: true },
        { isDefault: false }
      );
    }

    const checklist = new TradeChecklist({
      userId,
      name,
      description,
      category,
      isActive: isActive !== undefined ? isActive : true,
      isDefault: isDefault || false,
      instruments: instruments || [],
      strategies: strategies || [],
      items: items.map((item, index) => ({
        ...item,
        order: item.order || index + 1
      }))
    });

    const savedChecklist = await checklist.save();
    await savedChecklist.populate('userId', 'name email');

    res.status(201).json({
      message: 'Checklist created successfully',
      checklist: savedChecklist
    });
  } catch (error) {
    console.error('Error creating checklist:', error);
    res.status(500).json({ 
      message: 'Error creating checklist', 
      error: error.message 
    });
  }
});

// PUT /api/checklists/:id - Update checklist
router.put('/:id', checklistValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      name,
      description,
      category,
      isActive,
      isDefault,
      instruments,
      strategies,
      items
    } = req.body;

    const checklist = await TradeChecklist.findById(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    // If setting as default, unset other default checklists for this user
    if (isDefault && !checklist.isDefault) {
      await TradeChecklist.updateMany(
        { userId: checklist.userId, isDefault: true },
        { isDefault: false }
      );
    }

    const updateData = {
      name,
      description,
      category,
      isActive,
      isDefault,
      instruments: instruments || [],
      strategies: strategies || [],
      items: items.map((item, index) => ({
        ...item,
        order: item.order || index + 1
      }))
    };

    const updatedChecklist = await TradeChecklist.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'name email');

    res.json({
      message: 'Checklist updated successfully',
      checklist: updatedChecklist
    });
  } catch (error) {
    console.error('Error updating checklist:', error);
    res.status(500).json({ 
      message: 'Error updating checklist', 
      error: error.message 
    });
  }
});

// DELETE /api/checklists/:id - Delete checklist
router.delete('/:id', async (req, res) => {
  try {
    const checklist = await TradeChecklist.findById(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    // Check if checklist has any results
    const hasResults = await TradeChecklistResult.exists({ checklistId: req.params.id });
    
    if (hasResults) {
      return res.status(400).json({ 
        message: 'Cannot delete checklist that has been used. Consider deactivating it instead.' 
      });
    }

    await TradeChecklist.findByIdAndDelete(req.params.id);

    res.json({ message: 'Checklist deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    res.status(500).json({ 
      message: 'Error deleting checklist', 
      error: error.message 
    });
  }
});

// POST /api/checklists/:id/duplicate - Duplicate checklist
router.post('/:id/duplicate', async (req, res) => {
  try {
    const checklist = await TradeChecklist.findById(req.params.id);
    
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    const duplicatedChecklist = await checklist.duplicate();
    await duplicatedChecklist.populate('userId', 'name email');

    res.status(201).json({
      message: 'Checklist duplicated successfully',
      checklist: duplicatedChecklist
    });
  } catch (error) {
    console.error('Error duplicating checklist:', error);
    res.status(500).json({ 
      message: 'Error duplicating checklist', 
      error: error.message 
    });
  }
});

// GET /api/checklists/:id/results - Get results for a specific checklist
router.get('/:id/results', async (req, res) => {
  try {
    const { page = 1, limit = 10, isCompleted } = req.query;
    
    const filter = { checklistId: req.params.id };
    if (typeof isCompleted === 'boolean') {
      filter.isCompleted = isCompleted;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const results = await TradeChecklistResult.find(filter)
      .populate('tradeId', 'instrument date pnl result')
      .sort({ startedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TradeChecklistResult.countDocuments(filter);

    res.json({
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        hasNext: skip + results.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching checklist results:', error);
    res.status(500).json({ 
      message: 'Error fetching checklist results', 
      error: error.message 
    });
  }
});

// GET /api/checklists/results - Get all checklist results for a user
router.get('/results/all', async (req, res) => {
  try {
    const { userId, page = 1, limit = 10, isCompleted, checklistId, dateFrom, dateTo } = req.query;
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      isCompleted: isCompleted === 'true' ? true : isCompleted === 'false' ? false : undefined,
      checklistId,
      dateFrom,
      dateTo
    };

    const results = await TradeChecklistResult.getByUserId(userId, options);
    const total = await TradeChecklistResult.countDocuments({ userId });

    res.json({
      results,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalResults: total,
        hasNext: (parseInt(page) - 1) * parseInt(limit) + results.length < total,
        hasPrev: parseInt(page) > 1
      }
    });
  } catch (error) {
    console.error('Error fetching all checklist results:', error);
    res.status(500).json({ 
      message: 'Error fetching checklist results', 
      error: error.message 
    });
  }
});

// GET /api/checklists/results/trade/:tradeId - Get checklist result for a specific trade
router.get('/results/trade/:tradeId', async (req, res) => {
  try {
    const result = await TradeChecklistResult.getByTradeId(req.params.tradeId);
    
    if (!result) {
      return res.status(404).json({ message: 'No checklist result found for this trade' });
    }

    res.json({ result });
  } catch (error) {
    console.error('Error fetching trade checklist result:', error);
    res.status(500).json({ 
      message: 'Error fetching trade checklist result', 
      error: error.message 
    });
  }
});

// POST /api/checklists/results - Create or update checklist result
router.post('/results', checklistResultValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      userId,
      tradeId,
      checklistId,
      items,
      overallNotes,
      qualityScore,
      isCompleted
    } = req.body;

    // Verify trade exists (only if tradeId is provided)
    if (tradeId) {
      const trade = await Trade.findById(tradeId);
      if (!trade) {
        return res.status(404).json({ message: 'Trade not found' });
      }
    }

    // Verify checklist exists
    const checklist = await TradeChecklist.findById(checklistId);
    if (!checklist) {
      return res.status(404).json({ message: 'Checklist not found' });
    }

    // Check if result already exists for this trade (only if tradeId exists)
    let result = null;
    if (tradeId) {
      result = await TradeChecklistResult.findOne({ tradeId, checklistId });
    }
    
    if (result) {
      // Update existing result
      result.items = items.map((item, index) => ({
        ...item,
        order: item.order || index + 1
      }));
      
      if (isCompleted) {
        result.overallNotes = overallNotes;
        result.qualityScore = qualityScore;
        await result.complete(overallNotes, qualityScore);
      }
    } else {
      // Create new result
      result = new TradeChecklistResult({
        userId,
        tradeId,
        checklistId,
        checklistName: checklist.name,
        items: items.map((item, index) => ({
          ...item,
          order: item.order || index + 1
        })),
        overallNotes,
        qualityScore
      });

      if (isCompleted) {
        await result.complete(overallNotes, qualityScore);
      }
    }

    const savedResult = await result.save();
    await savedResult.populate('checklistId', 'name category');
    await savedResult.populate('tradeId', 'instrument date pnl result');

    res.status(201).json({
      message: 'Checklist result saved successfully',
      result: savedResult
    });
  } catch (error) {
    console.error('Error saving checklist result:', error);
    res.status(500).json({ 
      message: 'Error saving checklist result', 
      error: error.message 
    });
  }
});

// PUT /api/checklists/results/:id - Update checklist result
router.put('/results/:id', checklistResultValidation, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const {
      items,
      overallNotes,
      qualityScore,
      isCompleted
    } = req.body;

    const result = await TradeChecklistResult.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({ message: 'Checklist result not found' });
    }

    result.items = items.map((item, index) => ({
      ...item,
      order: item.order || index + 1
    }));

    if (isCompleted) {
      await result.complete(overallNotes, qualityScore);
    } else {
      result.overallNotes = overallNotes;
      result.qualityScore = qualityScore;
    }

    const updatedResult = await result.save();
    await updatedResult.populate('checklistId', 'name category');
    await updatedResult.populate('tradeId', 'instrument date pnl result');

    res.json({
      message: 'Checklist result updated successfully',
      result: updatedResult
    });
  } catch (error) {
    console.error('Error updating checklist result:', error);
    res.status(500).json({ 
      message: 'Error updating checklist result', 
      error: error.message 
    });
  }
});

// DELETE /api/checklists/results/:id - Delete checklist result
router.delete('/results/:id', async (req, res) => {
  try {
    const result = await TradeChecklistResult.findById(req.params.id);
    
    if (!result) {
      return res.status(404).json({ message: 'Checklist result not found' });
    }

    await TradeChecklistResult.findByIdAndDelete(req.params.id);

    res.json({ message: 'Checklist result deleted successfully' });
  } catch (error) {
    console.error('Error deleting checklist result:', error);
    res.status(500).json({ 
      message: 'Error deleting checklist result', 
      error: error.message 
    });
  }
});

module.exports = router; 