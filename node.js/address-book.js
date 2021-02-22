const express = require('express');
const moment = require('moment-timezone');
const multer = require('multer');
const upload = multer({dest: 'tmp_uploads/'});

const db =require(__dirname + '/../_connect_db');
const router = express.Router();

const dateFormat = "YYYY-MM-DD";



router.get('/insert', (req, res)=>{
    res.render('address-book/insert');
});
router.post('/insert', upload.none(), (req, res)=>{
    const email_pattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    const output = {
        success: false,
        error: '',
        status: 0,
        body: req.body,
        result: {}
    };

    if(!req.body.name || req.body.name.length<2){
        output.error = '請填寫正確的姓名';
        output.status = 410;
        return res.json(output);
    }

    if(!req.body.email || !email_pattern.test(req.body.email)){
        output.error = '請填寫合法的 email';
        output.status = 420;
        return res.json(output);
    }

    if(!req.body.birthday || ! /^\d{4}-\d{1,2}-\d{1,2}/.test(req.body.birthday)){
        output.error = '請填寫合法的生日';
        output.status = 430;
        return res.json(output);
    }

    // TODO: 檢查各必填欄位的格式或值


    const sql = `INSERT INTO \`address_book\`(\`name\`, \`email\`, \`mobile\`, \`birthday\`, \`address\`, \`created_at\`) 
VALUES (?, ?, ?, ?, ?, NOW())`;

    db.queryAsync(sql , [
        req.body.name,
        req.body.email,
        req.body.mobile,
        req.body.birthday,
        req.body.address,
    ])
        .then(r=>{
            output.result = r;
            output.success = true;
            console.log('result:', r);
            return res.json(output);
        })
        .catch(error=>{
            console.log(error);
            return res.json(output);
        })

});
router.post('/del/:sid', (req, res)=>{
    const sql = "DELETE FROM `address_book` WHERE `sid`=?";
    db.queryAsync(sql, [req.params.sid])
        .then(r=>{
            console.log(r);
            res.json(r);
        })
});

router.get('/edit/:sid', (req, res)=>{
    const sql = "SELECT * FROM address_book WHERE sid=?";
    db.queryAsync(sql, [req.params.sid])
        .then(result=>{
            if(! result || !result.length){
                res.redirect(req.baseUrl);
            } else {
                result[0].birthday = moment(result[0].birthday).format(dateFormat);
                res.render('address-book/edit', {row: result[0]});
            }
        })
        .catch(error=>{
            res.redirect(req.baseUrl);
        })
    //res.render('address-book/edit');
});

router.post('/edit/:sid', upload.none(), (req, res)=> {
    const email_pattern = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;

    const output = {
        success: false,
        error: '',
        status: 0,
        body: req.body,
        result: {}
    };

    if(!req.body.name || req.body.name.length<2){
        output.error = '請填寫正確的姓名';
        output.status = 410;
        return res.json(output);
    }

    if(!req.body.email || !email_pattern.test(req.body.email)){
        output.error = '請填寫合法的 email';
        output.status = 420;
        return res.json(output);
    }

    if(!req.body.birthday || ! /^\d{4}-\d{1,2}-\d{1,2}/.test(req.body.birthday)){
        output.error = '請填寫合法的生日';
        output.status = 430;
        return res.json(output);
    }

    const sql = `UPDATE \`address_book\` SET \`name\`=?,\`email\`=?,\`mobile\`=?,\`birthday\`=?,\`address\`=? WHERE sid=?`;
    db.queryAsync(sql , [
        req.body.name,
        req.body.email,
        req.body.mobile,
        req.body.birthday,
        req.body.address,
        req.params.sid
    ])
        .then(r=>{
            output.result = r;
            output.success = true;
            console.log('result:', r);
            return res.json(output);
        })
        .catch(error=>{
            console.log(error);
            return res.json(output);
        })

});

router.get('/list-api/:page?', (req, res)=>{
    const perPage = 5;
    let totalRows, totalPages;
    let page = req.params.page ? parseInt(req.params.page) : 1;

    const t_sql = "SELECT COUNT(1) num FROM `address_book`";
    db.queryAsync(t_sql)
        .then(result=>{
            totalRows = result[0].num; // 總筆數
            totalPages = Math.ceil(totalRows/perPage);

            // 限定 page 範圍
            if(page<1) page=1;
            if(page>totalPages) page=totalPages;

            const sql = `SELECT * FROM \`address_book\` ORDER BY sid DESC LIMIT  ${(page-1)*perPage}, ${perPage}`;

            return db.queryAsync(sql);
        })
        .then(result=>{
            result.forEach((row, idx)=>{
                row.birthday = moment(row.birthday).format(dateFormat);
            });

            res.json({
                totalRows,
                totalPages,
                page,
                rows: result
            });

        })
});

router.get('/:page?', (req, res)=>{
    const perPage = 5;
    let totalRows, totalPages;
    let page = req.params.page ? parseInt(req.params.page) : 1;

    const t_sql = "SELECT COUNT(1) num FROM `address_book`";
    db.queryAsync(t_sql)
        .then(result=>{
            totalRows = result[0].num; // 總筆數
            totalPages = Math.ceil(totalRows/perPage);

            // 限定 page 範圍
            if(page<1) page=1;
            if(page>totalPages) page=totalPages;

            const sql = `SELECT * FROM \`address_book\` ORDER BY sid DESC LIMIT  ${(page-1)*perPage}, ${perPage}`;

            return db.queryAsync(sql);
        })
        .then(result=>{
            result.forEach((row, idx)=>{
                row.birthday = moment(row.birthday).format(dateFormat);
            });

            res.render('address-book/list', {
                totalRows,
                totalPages,
                page,
                rows: result
            });

        })
});



module.exports = router;