const moment = require("moment");
const { STATUS, ACTIVECD } = require("../../global-constant");

module.exports = async function searchWorkingHours(fastify, opts) {

    fastify.get('/search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchWorkingHours'
        try {
            let getUserQuery = fastify.appdb('working_hours as s')
                .innerJoin('lookup_details as ld', 'ld.lookup_dtl_id', 's.weekday_id');

            if (query.id) {
                getUserQuery = getUserQuery.where({ 's.user_id': query.id });
            }

            const selectMappings = {
                workinghourId: "s.working_hour_id",
                weekDayId: "ld.lookup_dtl_id",
                weekDay: "ld.dtl_desc",
                workingFromTime: "s.working_from_time",
                workingToTime: "s.working_to_time",
                breakFromTime: "s.break_from_time",
                breakToTime: "s.break_to_time",
                workingAvailability: "s.working_availability",
                breakSpendHours: "s.break_spending_hours",
                createdDate: "s.created_date",
                updatedDate: "s.updated_date",
            };

            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search working_hours successfully:`, { query, resultCount: UserResult.length });
            return { ...UserResult, rows: UserResult.rows.sort((a, b) => a.weekDayId - b.weekDayId) };
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching working_hours:`, error);
            throw new Error('Error searching working_hours');
        }
    });

    fastify.get('/search/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'searchWorkingHoursById'
        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('WorkingHour ID is missing!', 400);
        }

        try {
            let getUserQuery = fastify.appdb('working_hours as s')
                .innerJoin('lookup_details as ld', 'ld.lookup_dtl_id', 's.weekday_id')
                .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 's.working_hour_status')
                .where({ 's.working_hour_id': params.id });

            const selectMappings = {
                workinghourId: "s.working_hour_id",
                weekDayId: "ld.lookup_dtl_id",
                weekDay: "ld.dtl_desc",
                workingFromTime: "s.working_from_time",
                workingToTime: "s.working_to_time",
                breakFromTime: "s.break_from_time",
                breakToTime: "s.break_to_time",
                workingAvailability: "s.working_availability",
                breakSpendHours: "s.break_spending_hours",
                workingHoursStatus: "ld1.dtl_desc",
                workingHoursStatusId: "ld1.lookup_dtl_id",
                updatedDate: "s.updated_date",
                createdDate: "s.created_date",
            };


            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectSingleRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search Working Hour by ID successfully:`, { id: params.id });
            return UserResult;
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching  Working Hour  by ID:`, error);
            throw new Error('Error searching  Working Hour by ID');
        }
    });

    fastify.get('/delete/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'disableById';
        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('WorkingHours ID is missing!', 400);
        }
        try {
            const deleteUserQuery = fastify.appdb('working_hours').where({ 'working_hour_id': params.id }).
                update({
                    'updated_date': new Date(),
                    'appointment_status': delStatus,
                });
            await deleteUserQuery;

            fastify.log.info(`${apiName}-WorkingHours deleted successfully:`, { WorkingHoursId: params.id });
            return fastify.lib.returnMessage('WorkingHours deleted successfully!', 200);
        } catch (error) {
            fastify.log.error(`${apiName}-Error deleting WorkingHours:`, error);
            throw new Error('Error deleting WorkingHours');
        }
    });

    fastify.get('/date-search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchWorkingHours'
        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD);

        // try {
        let getUserQuery = fastify.appdb('working_hours as s')
            .innerJoin('lookup_details as ld', 'ld.lookup_dtl_id', 's.weekday_id')
            .where({ "working_hour_status": status })

        if (query.id) {
            getUserQuery = getUserQuery.where({ 's.user_id': query.id });
        }
        if (query.date) {
            const date = moment(query.date, "DD-MM-YYYY");
            const dayOfWeek = date.format("dddd");
            console.log(dayOfWeek, date)
            getUserQuery = getUserQuery.where({ 'ld.dtl_desc': dayOfWeek });

        }

        const selectMappings = {
            workingFromTime: "s.working_from_time",
            workingToTime: "s.working_to_time",
            breakFromTime: "s.break_from_time",
            breakToTime: "s.break_to_time",
        };

        getUserQuery = getUserQuery.select(selectMappings);
        const UserResult = await fastify.lib.selectSingleRow(request, reply, getUserQuery);
        console.log(UserResult);
        const { workingFromTime, workingToTime, breakFromTime, breakToTime } = UserResult;
        const timeRangesArr = await fastify.lib.createTimeRangesArray(workingFromTime, workingToTime, breakFromTime, breakToTime);

        fastify.log.info(`${apiName}-Search working_hours successfully:`, { query, resultCount: UserResult.length });
        return [...timeRangesArr];
        // } catch (error) {
        //     fastify.log.error(`${apiName}-Error searching working_hours:`, error);
        //     throw new Error('Error searching working_hours');
        // }
    });
}