const Router = require('koa-router');
const messageRouter = new Router();
const userRouter = require('./user');
const resourceRouter = require('./resource');
const markRouter = require('./mark');
const settingsRouter = require('./settings');
const withdrawnRouter = require('./withdrawn');
const chatRouter = require('./chat');
const friendsApplicationRouter = require('./friendsApplication');
const dataRouter = require('./data');
const searchRouter = require('./search');
const addFriend = require('./addFriend');
const categoryRouter = require('./category');
const listRouter = require('./list');
const friendRouter = require('./friend');
const { OnlyUnbannedUser, OnlyUser } = require('../../middlewares/permission');
messageRouter
  .get('/', OnlyUser(), async (ctx, next) => {
    const { query, data, db } = ctx;
    const { uid } = query;
    const targetUser = await db.UserModel.findOne({ uid });
    if (targetUser) {
      data.targetUserId = uid;
    }
    ctx.template = 'message/message.2.pug';
    await next();
  })
  .use(
    '/friendsApplication',
    friendsApplicationRouter.routes(),
    friendsApplicationRouter.allowedMethods(),
  )
  .use('/withdrawn', withdrawnRouter.routes(), withdrawnRouter.allowedMethods())
  .use('/mark', markRouter.routes(), markRouter.allowedMethods())
  .use('/user', userRouter.routes(), userRouter.allowedMethods())
  .use('/settings', settingsRouter.routes(), settingsRouter.allowedMethods())
  .use('/resource', resourceRouter.routes(), resourceRouter.allowedMethods())
  .use('/chat', chatRouter.routes(), chatRouter.allowedMethods())
  .use('/search', searchRouter.routes(), searchRouter.allowedMethods())
  .use('/addFriend', addFriend.routes(), addFriend.allowedMethods())
  .use('/category', categoryRouter.routes(), categoryRouter.allowedMethods())
  .use('/list', listRouter.routes(), listRouter.allowedMethods())
  .use('/friend', friendRouter.routes(), friendRouter.allowedMethods())
  .use('/data', dataRouter.routes(), dataRouter.allowedMethods());
module.exports = messageRouter;
