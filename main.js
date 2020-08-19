import {createElement,render,Component} from './toy-react'

class MyComponent extends Component{
    constructor(){
        super();
        this.state={
            a:1,
            b:2
        }
    }
    render(){
        return <div>
            <h1>myComponent</h1>
            <span>{this.state.a.toString()}</span><button onClick={()=>{this.setState({a:this.state.a++})}}>add</button>
            <span>{this.state.b.toString()}</span>
                {this.children}
            </div>
    }
}

render(<MyComponent id="a" class="c">
    <div>123</div>
    <div>456</div>
    <div>456</div>
</MyComponent>,document.body)
