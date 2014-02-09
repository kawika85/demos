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
    it("should add the task", function() {
        this.todo_list.create(this.v_todo_)
         expect(this.todo_list.length).toEqual(1)
    });
    it("should remove the task", function() {
        this.todo_list.create(this.v_todo_)
        this.v_todo_.destroy()
         expect(this.todo_list.length).toEqual(0)
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
