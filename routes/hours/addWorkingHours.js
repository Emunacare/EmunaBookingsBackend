const { STATUS, ACTIVECD } = require('../../global-constant.js');

module.exports = async function AddWorkingHour(fastify, opts) {

    fastify.post('/add', async (request, reply) => {
        const { body } = request;
        const apiName = 'AddWorkingHour'

        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD)

        if (!body.weekDayId) {
            reply.code(400);
            return fastify.lib.returnMessage('One or more mandatory fields are missing!', 400);
        }

        let workingHour;

        try {
            await fastify.appdb.transaction(async (trx) => {
                const workingHourId = await trx('working_hours')
                    .insert({
                        weekday_id: body.weekDayId,
                        user_id: body.userId,
                        working_from_time: body.workingFromTime || null,
                        working_to_time: body.workingToTime || null,
                        break_from_time: body.breakFromTime || null,
                        break_to_time: body.breakToTime || null,
                        break_spending_hours: body.breakSpendHours || null,
                        working_availability: body.workingAvailability || null,
                        working_hour_status: body.workingStatus || null,
                        created_date: new Date(),
                    });

                workingHour = await trx('working_hours')
                    .select({ workingHourId: 'working_hour_id' })
                    .where({ working_hour_id: body.workingHourId ? body.workingHourId : workingHourId[0] })
                    .first();

            });
        } catch (error) {
            fastify.log.error(`${apiName}-Error executing transaction:`, error);
            throw new Error('Error submitting workingHours');
        }

        fastify.log.info(`${apiName}-Working Hours added successfully:`, { workingHour });
        return { ...workingHour };
    });

};
