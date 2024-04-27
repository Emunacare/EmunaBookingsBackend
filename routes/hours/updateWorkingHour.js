
const { STATUS, ACTIVECD } = require('../../global-constant.js');

module.exports = async function UpdateWorkingHour(fastify, opts) {

  fastify.post('/update', async (request, reply) => {
    const { body, headers } = request;
    const apiName = 'updateWorkingHours';
    const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD)

    if (!body.workinghourId || !body.weekDayId) {
      reply.code(400);
      return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
    }

    // try {
    const existingHolidays = await fastify.appdb('working_hours as s')
      .select('*')
      .where('working_hour_id', body.workinghourId)
      .first();

    if (!existingHolidays) {
      reply.code(404);
      return fastify.lib.returnMessage('Working Hour ID is invalid!', 404);
    }

    await fastify.appdb.transaction(async (trx) => {
      const userChangeFields = {
        weekday_id: body.weekDayId,
        working_from_time: body.workingFromTime,
        working_to_time: body.workingToTime,
        break_from_time: body.breakFromTime,
        break_to_time: body.breakToTime,
        break_spending_hours: body.breakSpendHours,
        working_availability: body.workingAvailability || null,
      };
      const updateUserData = Object.entries(userChangeFields).reduce((data, [key, value]) => {
        if (String(existingHolidays[key]) !== String(value)) {
          data[key] = value;
        }
        return data;
      }, {});

      if (Object.keys(updateUserData).length > 0) {
        await trx('working_hours')
          .where('working_hour_id', existingHolidays.working_hour_id)
          .update({
            ...updateUserData,
            updated_date: new Date(),
          });
      }

    });

    fastify.log.info(`${apiName}-Working Hour updated successfully:`, { workingHourId: body.workingHourId });
    return fastify.lib.returnMessage('Working Hour updated successfully!', 200);
    // } catch (error) {
    //   fastify.log.error(`${apiName}-Error updating Working Hour:`, error);
    //   throw new Error('Error updating Working Hour');
    // }
  });

};
