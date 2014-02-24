describe("Test Model", function() {

    beforeEach(function() {

        this.todoModels = window.TodosApp.Todos.models
        this.v_todo_=new this.todoModels.TodoInst({description:"bla bla bla",title:"title!"})
        this.nv_todo_=new this.todoModels.TodoInst({description:"",title:""})
        this.todo_list=new this.todoModels.TodoList()

    })

    it("should validate the task", function() {
         expect(this.v_todo_.isValid()).toEqual(true)
    });
    it("shouldn't validate the task", function() {
         expect(this.nv_todo_.isValid()).toEqual(false)
    });
    it("should add/remove the task", function() {
        this.todo_list.create(this.v_todo_)
         expect(this.todo_list.length).toEqual(1)
         this.v_todo_.destroy()
         expect(this.todo_list.length).toEqual(0)
    });


});

describe("Test Views", function() {

    beforeEach(function() {
        this.todoModels = window.TodosApp.Todos.models
    });

    it("should render form", function() {
            var aux_tasks=new this.todoModels.TaskList([{description:"task1",done:1},{description:"task2",done:0}])
            var aux_ent=new this.todoModels.TodoInst({description:"bla bla bla",title:"title!",tasks:aux_tasks})

			var form_ = new  window.TodosApp.Todos.views.Formu({	model: aux_ent });
            form_.render()

            expect( form_.$el.find('.title').val() ).toBe("title!")
            expect( form_.$el.find('.desc').val() ).toBe("bla bla bla")
            expect( form_.$el.find('.task-cont .row:eq( 0 ) span').first().text() ).toBe("task1")
            expect( form_.$el.find('.task-cont .row:eq( 1 ) span').first().text() ).toBe("task2")

    });


});
/*
describe("Test Routes", function() {

    beforeEach(function() {
        this.router=window.TodosApp.Todos.Router

    })

    afterEach( function(){
        Backbone.history.stop();
    })

  it("should call edit", function(){

    //expect(App.Router.prototype.edit).toHaveBeenCalled();  
  });

})
*/
