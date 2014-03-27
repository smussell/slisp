slisp
=====

This is my little toy lisp, for now called sam lisp until I find a better name.  This is a very simple lisp implementation on top of node.js.  I used the following articles as a guide on how to build a simple lisp.

 * http://norvig.com/lispy.html
 * http://norvig.com/lispy2.html
 * http://books.google.com/books?id=QzGuHnDhvZIC&lpg=PA756&vq=scheme%20interpreter&dq=Paradigms%20of%20Artificial%20Intelligence%20Programming&pg=PA753#v=onepage&q&f=false

If you want to run it just run 

    npm install

It is much easier to work with if you use rlwrap, which you can install on mac via homebrew. 

    rlwrap node slisp.js
  
##Examples

###Closure

    > (def addx (lambda (x) (lambda (y) (+ x y))))
    [Function]
    > (def add5 (addx 5))
    [Function]
    > (add5 10)
    15
    
###Conditional

    > (def n 10)
    10
    > (if (= n 10) 1 (- 1 1))
    1
    > (set! n 20)
    20
    > (if (= n 10) 1 (- 1 1))
    0



