'use strict';


//MODELS
TodosApp.module('Todos.models', function (Todos, App, Backbone) {

        Todos.TodoInst = Backbone.Model.extend({

                defaults: {
                    id: null,
                    inc_id: null,
			        title: null,
			        description: null,
			        done:0,
			        created:null
                },
		        initialize: function () {
			        if (this.isNew()) {
				        this.set('created', Date.now());
			        }
                    
		        },

        });


        Todos.TodoList = Backbone.Collection.extend({
                model: Todos.TodoInst,
                localStorage: new Backbone.LocalStorage('TodosApp-todolist'),
				
        })
})


//VIEWS

TodosApp.module('Todos.views', function (TodoViews, App, Backbone, Marionette, $) {

	TodoViews.ModalView = Marionette.ItemView.extend({
        template: "#template-removemodal",   
        className:  "modal fade remove_alert",
        events:{
            'click .confirm':'Confirm',
            'click .cancel':'Cancel'
        },
        Confirm:function(e){
            this.model.destroy()
            this.close();            

            //TODO real! bootstrap issue, modal closes but backdrop remains open
            $("body .modal-backdrop").remove()
        }     
     });

	TodoViews.ItemView = Marionette.ItemView.extend({
		tagName: 'tr',
		template: '#template-todo-row',
		events: {
			'click .save:not(.disabled)': 'Save',
			'click .remove': 'Remove',
			'click .done': 'ToggleDone',
		},
		modelEvents: {
			'change': 'render'
		},
        ToggleDone: function (e) {
            this.model.set("done",(this.model.get("done")==1)?0:1)

            //obviously has changed
            if(this.model.hasChanged("done"))
                this.$el.find(".save").removeClass("disabled")
        },
        Remove: function (e) {
			App.Todos.trigger('todo:remove',this.model);
        },
        Save: function (e) {
            var target=(e)?$(e.currentTarget):this.$el.find(".save")
//            this.model.set('updated', Date.now());
            this.model.save({},{
                                success:function(){console.log("target",target)
                                            target.removeClass("glyphicon-floppy-disk").addClass("glyphicon-floppy-saved").addClass("disabled")
                                        },
                                error:function(){
                                            target.removeClass("glyphicon-floppy-disk").addClass("glyphicon-floppy-remove")
                                        }
                                })

        }

	});


	TodoViews.ListView = Backbone.Marionette.CompositeView.extend({
		template: '#template-todo-list',
		itemView: TodoViews.ItemView,
		itemViewContainer: 'tbody',
		events: {
	        'click .toggle_all': 'ToggleAll',
	        'click .save_all': 'SaveAll',
        },
        SaveAll: function (e) {

            this.children.each(function(view){
                if(view.$el.is(":visible") && view.model.hasChanged("done"))
                    view.Save()
            });
        },
        ToggleAll: function (e) {

            this.children.each(function(view){
                if(view.$el.is(":visible"))
                    view.ToggleDone()
            });
        }

	});


});


//LAYOUT
TodosApp.module('Layout', function (Layout, App, Backbone) {

	Layout.Header = Backbone.Marionette.ItemView.extend({
		template: '#template-todo-header',
		events: {
			'click .add_todo': 'addTodo'
		},
        addTodo: function (e) {
			App.Todos.trigger('todo:add');
        }
	})

	Layout.Formu = Backbone.Marionette.ItemView.extend({
		template: '#template-todo-form',
        events: {
			'click .submit_form': 'submitForm'
		},

        submitForm: function (e) {

            var este=this
            var done_=(this.$el.find(".done").is(":checked"))?1:0
            this.model.set("title",this.$el.find(".title").val())
            this.model.set("description",this.$el.find(".desc").val())
            this.model.set("done",done_)

            if(!this.model.get("id")){
                this.model.set("inc_id",this.collection.length+1)
                this.collection.create(this.model)
            }else
                this.model.save()
            
            e.preventDefault();
            this.$el.slideUp("fast",function(){este.close();})

        }
	})




})

//CONTROLLER

TodosApp.module('Todos', function (Todos, App, Backbone, Marionette, $, _) {

	Todos.Router = Marionette.AppRouter.extend({
		appRoutes: {
            'edit/:id': 'Edit',
            'filter/:bl': 'Filter'
		}
	});


	Todos.Controller = function () {
		this.todoList = new App.Todos.models.TodoList();

	};

	_.extend(Todos.Controller.prototype, {

		start: function () {

			this.showHeader(this.todoList);
			this.showTodoList(this.todoList);
			this.todoList.fetch();
            var este=this
            Todos.on("todo:add", function(){
                    este.showForm();
                });
            Todos.on("todo:remove", function(model){
                    este.RemoveModal(model);
                });

		},

		showHeader: function (todoList) {
			var header = new App.Layout.Header({
				collection: todoList
			});
			App.header.show(header);
		},
        RemoveModal: function (model) {
            var modal_view= new Todos.views.ModalView({model:model})
            App.modal.show(modal_view);
            modal_view.$el.modal("show")
        },
        Edit: function (id) {
            if(this.todoList.get(id)){
			    var form_v = new App.Layout.Formu({
				    model: this.todoList.get(id)
			    });
			    App.aux_form.show(form_v);
            }
        },
        showForm: function (todomodel) {
            var aux_ent=new App.Todos.models.TodoInst({inc_id:this.todoList.length+1})
            //this.todoList.create(aux_ent)
			var form_ = new App.Layout.Formu({
				model: aux_ent,
                collection:this.todoList
			});
			App.aux_form.show(form_);
		},

		showTodoList: function (todoList) {
			App.main.show(new Todos.views.ListView({
				collection: todoList
			}));
		},

		Filter: function (filter) {

            //TODO (but real todo) filter shouldn't be like this...CSS
            $("#todo-l-container table tr").show();
            if(filter=="done" || filter=="pending")
    			$("#todo-l-container table td[data-done='"+((filter=="done")?0:1)+"'").parent().hide();
		}
	});



Todos.addInitializer(function () {
	var controller = new Todos.Controller();
	controller.router = new Todos.Router({
		controller: controller
	});
	controller.start();
});


});
