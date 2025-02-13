const Router = require('koa-router');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const router = new Router();
router
  .get(
    '/',
    OnlyOperation(Operations.experimentalColumnSettings),
    async (ctx, next) => {
      ctx.template = 'experimental/settings/column/column.pug';
      ctx.data.columnSettings = await ctx.db.SettingModel.getSettings('column');
      ctx.data.grades = await ctx.db.UsersGradeModel.find({}).sort({ _id: 1 });
      ctx.data.roles = await ctx.db.RoleModel.find({}).sort({ toc: -1 });
      await next();
    },
  )
  .put(
    '/',
    OnlyOperation(Operations.experimentalColumnSettings),
    async (ctx, next) => {
      const { body, db, nkcModules } = ctx;
      const { checkNumber } = nkcModules.checkData;
      let {
        xsfCount,
        digestCount,
        userGrade,
        contributeInfo,
        threadCount,
        transferInfo,
        closeColumnInfo,
        createColumnInfo,
        adminCertsId,
        pageCount,
        columnHomePostCountMin,
        columnHomeSort,
      } = body;
      checkNumber(xsfCount, {
        name: '开设条件 学术分',
        min: 0,
      });
      checkNumber(digestCount, {
        name: '开设条件 精华数',
        min: 0,
      });
      checkNumber(threadCount, {
        name: '开设条件 文章数',
        min: 0,
      });
      userGrade = await Promise.all(
        userGrade.filter(async (_id) => {
          const g = await db.UsersGradeModel.findOne({ _id });
          return !!g;
        }),
      );
      adminCertsId = await Promise.all(
        adminCertsId.filter(async (_id) => {
          const cert = await db.RoleModel.findOne({ _id });
          return !!cert;
        }),
      );
      if (!createColumnInfo) ctx.throw(400, '开设专栏注意事项不能为空');
      if (!contributeInfo) ctx.throw(400, '投稿注意事项不能为空');
      if (!transferInfo) ctx.throw(400, '专栏转让注意事项不能为空');
      if (!closeColumnInfo) ctx.throw(400, '关闭专栏注意事项不能为空');
      checkNumber(pageCount, {
        name: '专栏设置 自定义页面个数',
        min: 0,
      });
      checkNumber(columnHomePostCountMin, {
        name: '专栏列表 最小文章数',
        min: 0,
      });
      if (!['updateTime', 'subscription'].includes(columnHomeSort))
        ctx.throw(400, `专栏列表排序设置错误`);
      await db.SettingModel.updateOne(
        {
          _id: 'column',
        },
        {
          $set: {
            'c.xsfCount': xsfCount,
            'c.digestCount': digestCount,
            'c.userGrade': userGrade,
            'c.contributeInfo': contributeInfo,
            'c.threadCount': threadCount,
            'c.pageCount': pageCount,
            'c.transferInfo': transferInfo,
            'c.createColumnInfo': createColumnInfo,
            'c.closeColumnInfo': closeColumnInfo,
            'c.adminCertsId': adminCertsId,
            'c.columnHomePostCountMin': columnHomePostCountMin,
            'c.columnHomeSort': columnHomeSort,
          },
        },
      );
      await db.SettingModel.saveSettingsToRedis('column');
      await next();
    },
  );
module.exports = router;
