const express =require('express')
const db =require(__dirname+'/__connect_db')
const moment =require('moment-timezone')
const router = express.Router();

router.use((req,res,next)=>{
    res.locals.title='列表-通訊錄'
    next();
})

router.get('/add',(req,res)=>{
    res.locals.title='新增資料-通訊錄'
    res.render('address-book/add');
})
//新增
router.post('/add',(req,res)=>{
    const sql = "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`)VALUES" +"(?, ?, ?, ?, ?, NOW())";
db.query(sql,[
    req.body.name,
    req.body.email,
    req.body.mobile,
    req.body.birthday,
    req.body.address
],(error,results)=>{
   
    if(error){
        console.log(error);
        output.error=error
    }
    else{
        output.success=true;
        output.results=results;
    }
    res.json(output)
})
    
})

//列表
router.get('/list/:page?',(req,res)=>{
    res.locals.title='列表-通訊錄'
    const perpage =5;
    let totalRows =0;
    let totalPages=0;
    let page =req.params.page?parseInt(req.params.page):1;
    const t_sql = "SELECT COUNT(1) num FROM address_book";
    db.query(t_sql,(error,results)=>{
        totalRows = results[0].num;
        totalPages =Math.ceil(totalRows/perpage)
        if(page<1){
            res.redirect('/address-book/list/1')
            return
        }
        if(page>totalPages){
            res.redirect('/address-book/list/'+totalPages)
            return
        }
        const sql=`SELECT * FROM address_book  LIMIT ${(page-1)*perpage},${perpage}`;
    
        db.query(sql, (error, result, fields)=>{
            const fm ='YYYY-MM-DD';
            result.forEach(element => {
                element.birthday = moment(element.birthday).format(fm)
            });
            res.render('address-book/list',{
                perpage:perpage,
                page:page,
                totalRows:totalRows,
                totalPages:totalPages,
                row:result
            })
        })
    })
})

//刪除
router.get('del/:sid',(req,res)=>{
    const sql = "DELETE FROM `address_book` WHERE `sid` = ?";
    db.query(sql,[req.params.sid],(error,results)=>{
        // console.log('del',results);
        res.redirect(req.header('Referer'))
    })
})

//修改
router.get('edit/:sid',(req,res)=>{
    const sql = "SELECT * FROM `address_book` WHERE `sid` = ?";
    db.query(sql,[req.params.sid],(error,results)=>{
        if(results && results.length===1){
            results[0].birthday=moment(results[0].birthday).format('YYYY-MM-DD');
            res.render('address-book/edit',{row:results[0]});
        }
        else{
            return res.redirect('/address-book/list');
        }
    })
})
router.post('edit/:sid',(req,res)=>{

})
//一次新增多筆資料
router.get('/fake',(req,res)=>{
    return res.send('off')
    const sql = "INSERT INTO `address_book`(`name`, `email`, `mobile`, `birthday`, `address`, `created_at`)VALUES" +"(?, ?, ?, ?, ?, NOW())";
for(let i=0;i<100;i++){
    let email = new Date().getTime().toString(16)+Math.floor(Math.random*1000)+"gmail.com"

    db.query(sql,[
    'chris',
    email,
    '0963620472',
    '1997-05-11',
    '彰化市'
])}
res.json('ok')
})
module.exports=router