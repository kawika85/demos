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
			        created:null,
                    tasks:null
                },
                validate: function (attrs) {

                    var invalid_=[]
                    if (!attrs.title || attrs.title.length==0) 
                        invalid_.push({"attr":"title","message":"Please insert a Title"})
                    if (!attrs.description ||  attrs.description.length==0) 
                        invalid_.push({"attr":"description","message":"Please insert a Description"})

                    if (invalid_.length>0) return invalid_;
                },
		        initialize: function () {
			        if (this.isNew()) {
				        this.set('created', Date.now());
			        }
                    if(!this.get("tasks"))
                        this.set("tasks",new Todos.TaskList())

		        },
                 sync: function(method, model, options) {

                      if(model.get("tasks")){
                        var task_str=JSON.stringify(_.map(model.get("tasks").models,function(e){return [e.get("description"),e.get("done")]}))
                        model.set("tasks",task_str)
                    }
                      Backbone.sync(method, model, options);
                },
                parse : function(resp) {
console.log("resp.tasks",resp.tasks)
                    if(resp.tasks)
                        resp.tasks=new Todos.TaskList(_.map(JSON.parse(resp.tasks),function(e){return {description:e[0],done:e[1]}}))

                    return resp;
                }

        });

        Todos.TaskInst = Backbone.Model.extend({
                defaults: {
			        description: null,
			        done:0
                }
        });

        Todos.TaskList = Backbone.Collection.extend({
                model: Todos.TaskInst
				
        })
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
        render:function (eventName) {
            var title_=(this.model.models)?"the entire collection":this.model.get("title")
            var template_ = _.template($(this.template).html(), {modal_title: title_});
            $(this.el).html(template_);
            return this;
        },
        Confirm:function(e){

            //TODO if its a collection, remove according filter
            //TODO after reset should perform sync, or extend reset to do destroy() on all childs 
            if(this.model.models)
                this.model.reset()
            else
                this.model.destroy()

            this.close();            

            //TODO real! bootstrap issue, modal closes but backdrop remains open. It's because outside the view .el
            $("body .modal-backdrop").remove()
            e.preventDefault();
        }     
     });

    TodoViews.NoItemsView = Backbone.Marionette.ItemView.extend({
        template: "#template-noitems"
    });
	TodoViews.ItemView = Backbone.Marionette.Layout.extend({
		tagName: 'div',
        className: 'row',
		template: '#template-todo-row',
		events: {
			'click .save:not(.disabled)': 'Save',
			'click .remove': 'Remove',
			'click .done': 'ToggleDone',
			'click .show-tasks': 'ShowTasks',

		},
        ShowTasks:function(e){

            if(this.$el.find(".tasks_container").length==0){
                var este=this
                this.$el.append($('<div />').attr({ class: "tasks_container col-xs-12"}))
                this.addRegions({tasks:".tasks_container"})
                var task_view=new TodoViews.TaskListView({collection:este.model.get("tasks")})
                this.tasks.show(task_view)
                this.$el.find(".save").removeClass("disabled")
                $(e.currentTarget).removeClass("glyphicon-chevron-down").addClass("glyphicon-chevron-up")
            }else{
                $(e.currentTarget).removeClass("glyphicon-chevron-up").addClass("glyphicon-chevron-down")
                this.tasks.close();
                this.$el.find(".tasks_container").empty().remove()
            }
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
            this.model.save({},{
                                success:function(){
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
		itemViewContainer: '.list-cont',
        emptyView: TodoViews.NoItemsView,
		events: {
	        'click .toggle_all': 'ToggleAll',
	        'click .save_all': 'SaveAll',
	        'click .remove_all': 'DeleteAll',
        },
        DeleteAll: function (e) {
			App.Todos.trigger('todo:remove',this.collection);
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

	TodoViews.TaskView = Marionette.ItemView.extend({
		tagName: 'div',
        className: 'row',
		template: '#template-task-row',
		events: {
			'click .remove': 'Remove',
			'click .task-done': 'ToggleDone',
			'click .edit': 'EnEdit',
            'dblclick .editable': 'EnEdit',
			'keyup .editable input': 'ChangeDesc',
            'change .editable input': 'DisEdit',
		},
        DisEdit: function (e) {


            this.$el.find(".editable").addClass("disabled").removeClass("enabled")

        },
        EnEdit: function (e) {

            if(this.$el.find(".editable").hasClass("disabled"))
                this.$el.find(".editable").removeClass("disabled").addClass("enabled")
            else
                this.$el.find(".editable").addClass("disabled").removeClass("enabled")
        
            this.$el.find(".editable input").focus();
        },
        ChangeDesc: function (e) {
            this.model.set("description",$(e.currentTarget).val())
            this.$el.find(".editable>span").html($(e.currentTarget).val())
        },
        ToggleDone: function (e) {
            this.model.set("done",(this.model.get("done")==1)?0:1)
            if(this.model.get("done")==1)
                this.$el.find(".task-done").addClass("glyphicon-check").removeClass("glyphicon-unchecked")
            else
                this.$el.find(".task-done").addClass("glyphicon-unchecked").removeClass("glyphicon-check")
        },
        Remove: function (e) {
			this.model.destroy()
        }
    });

	TodoViews.TaskListView = Backbone.Marionette.CompositeView.extend({
		template: '#template-task-list',
		itemView: TodoViews.TaskView,
		itemViewContainer: '.task-cont',
        emptyView: TodoViews.NoItemsView,
		events: {
			'click .add_task': 'addTask',
		},
        addTask: function (e) {
            this.collection.add(new App.Todos.models.TaskInst())
            var child_view=this.children.findByIndex(this.children.length-1)
            child_view.$el.find(".editable").removeClass("disabled").addClass("enabled")
            child_view.$el.find(".editable input").focus();
        }
    });



	TodoViews.Header = Backbone.Marionette.ItemView.extend({
		template: '#template-todo-header',
		events: {
			'click .add_todo': 'addTodo'
		},
        addTodo: function (e) {
			App.Todos.trigger('todo:add');
        }
	})


	TodoViews.Formu = Backbone.Marionette.Layout.extend({
		template: '#template-todo-form',
        regions:{
            tasksform: '.tasks-form'    
        },
        events: {
			'click .submit_form': 'submitForm'
		},
        onRender:function() {
            var task_view=new TodoViews.TaskListView({collection:this.model.get("tasks")})
            this.tasksform.show(task_view)
        },
        submitForm: function (e) {

            var este=this
            this.model.set({"title":this.$el.find(".title").val(),
                            "description":this.$el.find(".desc").val(),
                            "done":(this.$el.find(".done").is(":checked"))?1:0})

            this.$el.find("input,textarea").tooltip('destroy')
            if(this.model.isValid())
            {
                if(!this.model.get("id")){
                    this.model.set("inc_id",this.collection.length+1)
                    this.collection.create(this.model)
                }else
                    this.model.save()

                this.$el.slideUp("fast",function(){este.close();})    
                window.location.hash=""

            }else
            {
                _.each(this.model.validate(this.model.attributes),
                                            function(validate_rule){

                                                este.$el.find("[name='"+validate_rule["attr"]+"']").tooltip({
                                                    placement:"right",
                                                    title:validate_rule["message"]
                                                }).tooltip('show')

                                            });

            }

            e.preventDefault();   


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

            this.todoList.fetch();
			this.showHeader(this.todoList);
			this.showTodoList(this.todoList);
			var este=this
            Todos.on("todo:add", function(){
                    este.showForm();
                });
            Todos.on("todo:remove", function(model){
                    este.RemoveModal(model);
                });

		},

		showHeader: function (todoList) {
			var header = new Todos.views.Header({
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
			    var form_v = new Todos.views.Formu({
				    model: this.todoList.get(id)
			    });
			    App.aux_form.show(form_v);

                //not normal, bug?
                App.aux_form.$el.show()


            }

        },
        showForm: function (todomodel) {
            var aux_ent=new App.Todos.models.TodoInst({inc_id:this.todoList.length+1})
            //this.todoList.create(aux_ent)
			var form_ = new Todos.views.Formu({
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
