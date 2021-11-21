/*
 * 原函数的本地开发调试入口
 * 描述： 通过此脚本，require云函数的入口文件，再配合express，从而达到本地模拟运行云函数的目的
 * @Author: Kelvin.Panjiawen 
 * @Date: 2021-03-08 15:42:26 
 * @Last Modified by: Kelvin.Panjiawen
 * @Last Modified time: 2021-03-08 19:00:40
 */


const port = 3000
let app = require('./index')

app.listen(port, () => console.log(`Example app listening on port ${port}!`))