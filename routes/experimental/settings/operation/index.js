const Router = require('koa-router');
const { OnlyOperation } = require('../../../../middlewares/permission');
const { Operations } = require('../../../../settings/operations');
const operationRouter = new Router();
operationRouter
  .use(
    '/',
    OnlyOperation(Operations.visitOperationSetting),
    async (ctx, next) => {
      const { data, db } = ctx;
      ctx.template = 'experimental/settings/operation.pug';
      const defaultOperationTypes = await db.OperationTypeModel.find({
        type: { $ne: 'common' },
      });
      data.defaultOperationTypes = await Promise.all(
        defaultOperationTypes.map(async (type) => {
          await type.extendOperationCount();
          return type;
        }),
      );
      const operationTypes = await db.OperationTypeModel.find({
        type: 'common',
      }).sort({ toc: 1 });
      data.operationTypes = await Promise.all(
        operationTypes.map(async (type) => {
          await type.extendOperationCount();
          return type;
        }),
      );
      data.type = 'operation';
      data.operations = await db.OperationModel.find().sort({ toc: 1 });
      await next();
    },
  )
  .get(
    '/',
    OnlyOperation(Operations.visitOperationSetting),
    async (ctx, next) => {
      await next();
    },
  )
  .post('/', OnlyOperation(Operations.addOperationType), async (ctx, next) => {
    const { db, body } = ctx;
    let { displayName } = body;
    displayName = displayName.trim();
    if (!displayName) ctx.throw(400, '分类名不能为空');
    const sameDisplayNameType = await db.OperationTypeModel.findOne({
      displayName,
    });
    if (sameDisplayNameType) ctx.throw(400, '分类名已存在');
    const newType = db.OperationTypeModel({
      _id: await db.SettingModel.operateSystemID('operationTypes', 1),
      displayName,
    });
    await newType.save();
    await next();
  })
  .put('/', OnlyOperation(Operations.modifyOperation), async (ctx, next) => {
    const { db, body } = ctx;
    const { description, errInfo, operationId } = body;
    if (!description) ctx.throw(400, '操作说明不能为空');
    if (!errInfo) ctx.throw(400, '错误提示不能为空');
    const operation = await db.OperationModel.findOnly({ _id: operationId });
    await operation.updateOne({ description, errInfo, tlm: Date.now() });
    await db.OperationModel.saveAllOperationsToRedis();
    await next();
  })
  .get(
    '/:_id',
    OnlyOperation(Operations.visitOperationType),
    async (ctx, next) => {
      const { data, db, params } = ctx;
      const { _id } = params;
      const operationType = await db.OperationTypeModel.findOnly({ _id });
      await operationType.extendOperations();
      data.operationType = operationType;
      await next();
    },
  )
  .put(
    '/:_id',
    OnlyOperation(Operations.modifyOperationType),
    async (ctx, next) => {
      const { db, params, body } = ctx;
      const { _id } = params;
      const { operation } = body;
      const operationType = await db.OperationTypeModel.findOnly({ _id });
      if (operation === 'modifyDisplayName') {
        let { displayName } = body;
        displayName = displayName.trim();
        if (!displayName) ctx.throw(400, '分类名不能为空');
        const sameDisplayNameType = await db.OperationTypeModel.findOne({
          displayName,
        });
        if (sameDisplayNameType) ctx.throw(400, '分类名已存在');
        await operationType.updateOne({ displayName });
      } else if (operation === 'moveOperations') {
        const { operations } = body;
        await db.OperationModel.updateMany(
          { _id: { $in: operations } },
          { $addToSet: { typeId: operationType._id } },
        );
      } else if (operation === 'deleteOperations') {
        const { operations } = body;
        await db.OperationModel.updateMany(
          { _id: { $in: operations } },
          { $pull: { typeId: operationType._id } },
        );
      }

      await next();
    },
  )
  .del(
    '/:_id',
    OnlyOperation(Operations.deleteOperationType),
    async (ctx, next) => {
      const { db, params } = ctx;
      const { _id } = params;
      const operationType = await db.OperationTypeModel.findOnly({ _id });
      if (operationType.type !== 'common')
        ctx.throw(400, '默认分类无被删除！！！');
      await db.OperationModel.updateMany(
        { typeId: operationType._id },
        { $pull: { typeId: operationType._id } },
      );
      await operationType.deleteOne();
      await next();
    },
  );
module.exports = operationRouter;
