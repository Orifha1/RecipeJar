//This is a method to avoid having a try catch for every async function. Instead you rap your function into catchAsync method. 
module.exports = func => {
    return (req, res, next) => {
        func(req, res, next).catch(next);
    }
}