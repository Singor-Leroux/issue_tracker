// routes/api.js
'use strict';
const Issue = require('../models/issue');
const mongoose = require('mongoose');

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res){
      let project = req.params.project;
      let query = req.query;
      query.project = project; // Filter by project name

      // Convert 'open' string from query to boolean if present
      if (query.open === 'true') query.open = true;
      if (query.open === 'false') query.open = false;

      try {
        const issues = await Issue.find(query).exec();
        res.json(issues);
      } catch (err) {
        res.status(500).json({ error: 'could not retrieve issues' });
      }
    })
    
    .post(async function (req, res){
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const newIssue = new Issue({
        project: project,
        issue_title,
        issue_text,
        created_by,
        assigned_to: assigned_to || '',
        status_text: status_text || '',
        created_on: new Date(),
        updated_on: new Date(),
        open: true
      });

      try {
        const savedIssue = await newIssue.save();
        // Return all fields, even if optional ones were not submitted (they'll have defaults)
        res.json({
          _id: savedIssue._id,
          issue_title: savedIssue.issue_title,
          issue_text: savedIssue.issue_text,
          created_on: savedIssue.created_on,
          updated_on: savedIssue.updated_on,
          created_by: savedIssue.created_by,
          assigned_to: savedIssue.assigned_to,
          open: savedIssue.open,
          status_text: savedIssue.status_text
        });
      } catch (err) {
        res.status(500).json({ error: 'could not save issue' });
      }
    })
    
    .put(async function (req, res){
      // No project param needed here as _id is unique
      const { _id, ...updateFields } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      
      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.json({ error: 'could not update', '_id': _id });
      }

      const fieldsToUpdate = {};
      Object.keys(updateFields).forEach(key => {
        if (updateFields[key] !== '' && updateFields[key] !== undefined && updateFields[key] !== null) {
          fieldsToUpdate[key] = updateFields[key];
        }
      });
      
      if (Object.keys(fieldsToUpdate).length === 0) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }

      fieldsToUpdate.updated_on = new Date();
      // Convert 'open' string to boolean if sent
      if (typeof fieldsToUpdate.open === 'string') {
         fieldsToUpdate.open = (fieldsToUpdate.open === 'true');
      }


      try {
        const updatedIssue = await Issue.findByIdAndUpdate(_id, fieldsToUpdate, { new: true });
        if (!updatedIssue) {
          return res.json({ error: 'could not update', '_id': _id });
        }
        res.json({ result: 'successfully updated', '_id': _id });
      } catch (err) {
        res.json({ error: 'could not update', '_id': _id });
      }
    })
    
    .delete(async function (req, res){
      // No project param needed here as _id is unique
      const { _id } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }

      if (!mongoose.Types.ObjectId.isValid(_id)) {
        return res.json({ error: 'could not delete', '_id': _id });
      }

      try {
        const deletedIssue = await Issue.findByIdAndDelete(_id);
        if (!deletedIssue) {
          return res.json({ error: 'could not delete', '_id': _id });
        }
        res.json({ result: 'successfully deleted', '_id': _id });
      } catch (err) {
        res.json({ error: 'could not delete', '_id': _id });
      }
    });
    
};