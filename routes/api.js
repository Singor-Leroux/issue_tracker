'use strict';
const Issue = require('../models/issue');
const mongoose = require('mongoose');

module.exports = function (app) {

  app.route('/api/issues/:project')
  
    .get(async function (req, res){
      let project = req.params.project;
      let filterObject = { project_name: project }; // Toujours filtrer par projet

      // Ajouter des filtres de requête à l'objet de filtre
      for (const key in req.query) {
        if (req.query.hasOwnProperty(key)) {
          // Gérer la conversion de chaîne 'true'/'false' en booléen pour 'open'
          if (key === 'open' && (req.query[key] === 'true' || req.query[key] === 'false')) {
            filterObject[key] = req.query[key] === 'true';
          } else if (key === '_id' && mongoose.Types.ObjectId.isValid(req.query[key])) {
             filterObject[key] = req.query[key];
          } else if (key !== '_id') { // Ne pas ajouter _id si ce n'est pas un ObjectId valide
            filterObject[key] = req.query[key];
          }
        }
      }
      
      try {
        const issues = await Issue.find(filterObject);
        res.json(issues);
      } catch (err) {
        console.error(err);
        res.status(500).send("Error retrieving issues");
      }
    })
    
    .post(async function (req, res){
      let project = req.params.project;
      const { issue_title, issue_text, created_by, assigned_to, status_text } = req.body;

      if (!issue_title || !issue_text || !created_by) {
        return res.json({ error: 'required field(s) missing' });
      }

      const newIssue = new Issue({
        project_name: project,
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
        console.error(err);
        res.status(500).send("Error saving issue");
      }
    })
    
    .put(async function (req, res){
      // let project = req.params.project; // Non nécessaire ici car _id est unique
      const { _id, ...updateFields } = req.body;

      if (!_id) {
        return res.json({ error: 'missing _id' });
      }
      
      if (!mongoose.Types.ObjectId.isValid(_id)) {
          return res.json({ error: 'could not update', '_id': _id });
      }

      const fieldsToUpdate = {};
      let hasUpdateFields = false;
      for (const key in updateFields) {
        if (updateFields.hasOwnProperty(key) && updateFields[key] !== undefined && updateFields[key] !== '') {
          fieldsToUpdate[key] = updateFields[key];
          hasUpdateFields = true;
        }
      }

      if (!hasUpdateFields) {
        return res.json({ error: 'no update field(s) sent', '_id': _id });
      }

      fieldsToUpdate.updated_on = new Date();
      // Si 'open' est envoyé comme chaîne "false", convertissez-le en booléen
      if (fieldsToUpdate.hasOwnProperty('open') && typeof fieldsToUpdate.open === 'string') {
          fieldsToUpdate.open = fieldsToUpdate.open === 'true'; // ou false selon la logique, ici on suppose que 'false' string signifie fermer
      }


      try {
        const updatedIssue = await Issue.findByIdAndUpdate(_id, { $set: fieldsToUpdate }, { new: true });
        if (!updatedIssue) {
          return res.json({ error: 'could not update', '_id': _id });
        }
        res.json({ result: 'successfully updated', '_id': _id });
      } catch (err) {
        console.error(err);
        res.json({ error: 'could not update', '_id': _id });
      }
    })
    
    .delete(async function (req, res){
      // let project = req.params.project; // Non nécessaire ici
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
        console.error(err);
        res.json({ error: 'could not delete', '_id': _id });
      }
    });
    
};