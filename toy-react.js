const RENDER_TO_DOM=Symbol('renderToDom');
export class Component{
    constructor(){
        this.props=Object.create(null);
        this.children=[];
        this._root=null;
        this._range=null;
    }
    setAttribute(name,value){
        this.props[name]=value;
    }
    appendChild(component){
        this.children.push(component)
    }
    [RENDER_TO_DOM](range){
        this._range=range;
        this._vdom=this.vdom;
        this._vdom[RENDER_TO_DOM](range)
    }
    
    get vdom(){
        return this.render().vdom;
    }
    update(){
        let isSameNode=(oldNode,newNode)=>{
            if(newNode.type !==oldNode.type) return false
            for(let prop in newNode.props){
                if(newNode.props[prop]!==oldNode.props[prop]){
                    return false;
                }
            }
            if(Object.keys(oldNode.props).length>Object.keys(newNode.props).length) return false;
            if(newNode.type==="#text"){
                if(newNode.content!==oldNode.content){
                    return false;
                }
            }
            return true;
        }
        let update=(oldNode,newNode)=>{
            if(!isSameNode(newNode,oldNode)){
                newNode[RENDER_TO_DOM](oldNode._range)
                return;
            }
            newNode._range=oldNode._range;
            let newChildren=newNode.vchildren;
            let oldChildren=oldNode.vchildren;
            if(!newChildren || !newChildren.length) return;

            let tailRange=oldChildren[oldChildren.length-1]._range;
            for(let i=0;i<newChildren.length;i++){
                let newchild=newChildren[i];
                let oldChild=oldChildren[i];
                if(i <oldChildren.length){
                    update(oldChild,newchild);
                }else{
                    let range=document.createRange();
                    range.setStart(tailRange.endContainer,tailRange.endOffset);
                    range.setEnd(tailRange.endContainer,tailRange.endOffset);
                    newchild[RENDER_TO_DOM](range);
                    tailRange=range;
                }
            }

        }
        let vdom=this.vdom;
        update(this._vdom,vdom)
        this._vdom=vdom;
    }
    setState(newState){
        if(this.state===null || typeof this.state!=="object"){
            this.state=newState;
            this.update();
            return;
        }
        let merge=(oldState,newState)=>{
            for(let p in newState){
                if(oldState[p]===null || typeof oldState[p]!=="object"){
                    oldState[p]=newState[p]
                }else{
                    merge(oldState[p],newState[p])
                }
            }
        }
        merge(this.state,newState);
        this.update();
    }
}
class ElementWraper extends Component{
    constructor(type){
        super(type);
        this.type=type;
    }
    get vdom(){
        this.vchildren=this.children.map(child=>child.vdom)
        return this;
    }
    [RENDER_TO_DOM](range){
        this._range=range;
        let root=document.createElement(this.type);
        for(let name in this.props){
            let value=this.props[name];
            if(name.match(/^on([\s\S]+)/)){
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/,c=>c.toLocaleLowerCase()),value)
            }else{
                if(name="className"){
                     name="class"
                }
                root.setAttribute(name,value);
            }
        }
        if(!this.vchildren){
            this.vchildren=this.children.map(child=>child.vdom);
        }
        for(let child of this.vchildren){
            let childRange=document.createRange();
            childRange.setStart(root,root.childNodes.length);
            childRange.setEnd(root,root.childNodes.length);
            child[RENDER_TO_DOM](childRange);
        }
        replaceContent(range,root)
    }
}
class TextWraper extends Component{
    constructor(content){
        super(content);
        this.content=content;
        this.type="#text";
    }
    [RENDER_TO_DOM](range){
        this._range=range;
        let root=document.createTextNode(this.content)
        replaceContent(range,root)
    }
    get vdom(){
        return this;
    }
}

function replaceContent(range,node){
    range.insertNode(node);
    range.setStartAfter(node);
    range.deleteContents();
    range.setStartBefore(node);
    range.setEndAfter(node);
}

export function createElement(type,attributes,...children){
    let e;
    if(typeof type==="string"){
        e=new ElementWraper(type);
    }else{
        e=new type;
    }
    for(let p in attributes){
        e.setAttribute(p,attributes[p]);
    }
    let insertChildren=(children)=>{
        for(let child of children){
            if(typeof child==="string"){
                child=new TextWraper(child)
            }
            if(child===null){
                continue;
            }
            if(typeof child==="object" && child instanceof Array){
                child=insertChildren(child)
            }else{
                e.appendChild(child)
            }
        }
        
    }
    insertChildren(children);
    return e;
}

export function render(component,parentElement){
    let range=document.createRange();
    range.setStart(parentElement,parentElement.childNodes.length);
    range.setEnd(parentElement,parentElement.childNodes.length);
    range.deleteContents();
    component[RENDER_TO_DOM](range);
}
