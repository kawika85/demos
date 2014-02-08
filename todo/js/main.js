'use strict';

var TodosApp = new Backbone.Marionette.Application();

TodosApp.addRegions({
	header: '#todo-h-container',
	aux_form: '#todo-form-container',
	main: '#todo-l-container',
	modal: '#modal-container'
});

TodosApp.on('initialize:after', function () {
	Backbone.history.start();
});
