const moment = require('moment');
const { STATUS, ACTIVECD, INACTIVECD } = require('../../global-constant.js');

module.exports = async function searchAppointment(fastify, opts) {

    fastify.get('/search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchAppointment'
        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD);

        try {
            let getUserQuery = fastify.appdb('appointments as j')
                .innerJoin('users as u', 'u.user_id', 'j.recipient_id')
                .innerJoin('users as u1', 'u1.user_id', 'j.user_id')
                .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id')
                .leftJoin('pictures as p1', 'p1.picture_id', 'u1.picture_id')
                .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 'j.appointment_status')
                .where({ 'appointment_status': status });


            if (query.name) {
                let filterName = String(query.name).replace(/\s/g, '');
                getUserQuery = getUserQuery.whereRaw(`CONCAT(j.appointment_title) LIKE '%${filterName}%'`);
            }
            if (query.id) {
                getUserQuery = getUserQuery.where({ 'u.user_id': query.id });;
            }

            const selectMappings = {
                appointmentId: "j.appointment_id",
                consultantId: "u.user_id",
                consultantFirstName: "u.first_name",
                consultantLastName: "u.last_name",
                consultantPictureId: "p.picture_id",
                consultantPictureName: "p.file_name",
                consultantPictureLink: "u.picture",
                clientId: "u1.user_id",
                clientFirstName: "u1.first_name",
                clientLastName: "u1.last_name",
                clientPictureId: "p1.picture_id",
                clientPictureName: "p1.file_name",
                clientPictureLink: "u1.picture",
                appointmentTitle: "j.appointment_title",
                appointmentStartDate: "j.appointment_start_date",
                appointmentEndDate: "j.appointment_end_date",
                appointmentStartTime: "j.appointment_start_time",
                appointmentEndTime: "j.appointment_end_time",
                appointmentStatus: "j.appointment_status",
                appointmentDescription: "j.appointment_description",
                clientEmail: "u1.office_email",
                clientPhone: "u1.office_phone",
                createdDate: "j.created_date",
                updatedDate: "j.updated_date",
            };

            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search Appointments successfully:`, { query, resultCount: UserResult.length });
            return { ...UserResult, rows: UserResult.rows.sort((a, b) => b.userId - a.userId) };
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching appointments:`, error);
            throw new Error('Error searching appointments');
        }
    });

    fastify.get('/search/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'searchAppointmentByID'
        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD);

        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('Appointment ID is missing!', 400);
        }

        try {
            let getUserQuery = fastify.appdb('appointments as j')
                .innerJoin('users as u', 'u.user_id', 'j.recipient_id')
                .innerJoin('users as u1', 'u1.user_id', 'j.user_id')
                .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id')
                .leftJoin('pictures as p1', 'p1.picture_id', 'u1.picture_id')
                .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 'j.appointment_status')
                .where({ 'j.appointment_id': params.id })
                .where({ 'appointment_status': status });


            const selectMappings = {
                appointmentId: "j.appointment_id",
                consultantId: "u.user_id",
                consultantFirstName: "u.first_name",
                consultantLastName: "u.last_name",
                consultantPictureId: "p.picture_id",
                consultantPictureName: "p.file_name",
                consultantPictureLink: "u1.picture",
                clientId: "u1.user_id",
                clientfirstName: "u1.first_name",
                clientlastName: "u1.last_name",
                clientPictureId: "p1.picture_id",
                clientPictureName: "p1.file_name",
                clientPictureLink: "u1.picture",
                appointmentTitle: "j.appointment_title",
                appointmentStartDate: "j.appointment_start_date",
                appointmentEndDate: "j.appointment_end_date",
                appointmentStartTime: "j.appointment_start_time",
                appointmentEndTime: "j.appointment_end_time",
                appointmentStatus: "j.appointment_status",
                appointmentDescription: "j.appointment_description",
                createdDate: "j.created_date",
                upatedDate: "j.updated_date",
            };


            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectSingleRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search Appointmnet by ID successfully:`, { id: params.id });
            return UserResult;
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching Appointmnet by ID:`, error);
            throw new Error('Error searching Appointmnet by ID');
        }
    });

    fastify.delete('/delete/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'deleteAppointmentById';
        const delStatus = await fastify.lib.getLookUpId(fastify, STATUS, INACTIVECD);

        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('Appointment ID is missing!', 400);
        }
        try {

            const deleteUserQuery = fastify.appdb('appointments')
                .where({ 'appointment_id': params.id })
                .update({
                    'updated_date': new Date(),
                    'appointment_status': delStatus,
                });;
            await deleteUserQuery;

            fastify.log.info(`${apiName}-Appointment deleted successfully:`, { id: params.id });
            return { message: 'Appointment deleted successfully' };
        } catch (error) {
            fastify.log.error(`${apiName}-Error deleting Appointment:`, error);
            throw new Error('Error deleting Appointment');
        }
    });

    fastify.get('/date-search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchAppointment'
        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD);

        try {
            let getUserQuery = fastify.appdb('appointments as j')
                .innerJoin('users as u', 'u.user_id', 'j.recipient_id')
                .innerJoin('users as u1', 'u1.user_id', 'j.user_id')
                .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id')
                .leftJoin('pictures as p1', 'p1.picture_id', 'u1.picture_id')
                .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 'j.appointment_status')
                .where({ 'appointment_status': status });

            // if (query.date || query.month || query.year) {
            //     getUserQuery = getUserQuery.andWhere(function () {
            //         if (query.date) {
            //             this.whereRaw(`DAY(j.appointment_start_date) = ? OR DAY(j.appointment_end_date) = ?`, [query.date, query.date])
            //                 .orWhereRaw(`DAY(j.appointment_start_date) <= ? AND DAY(j.appointment_end_date) >= ?`, [query.date, query.date]);
            //         }
            //         if (query.month) {
            //             this.whereRaw(`MONTH(j.appointment_start_date) = ? OR MONTH(j.appointment_end_date) = ?`, [query.month, query.month]);
            //         }
            //         if (query.year) {
            //             this.whereRaw(`YEAR(j.appointment_start_date) = ? OR YEAR(j.appointment_end_date) = ?`, [query.year, query.year]);
            //         }
            //     });
            // }
            if (query.date) {
                console.log(query.date);
                const newDate = moment(new Date(query.date)).format("YYYY-MM-DD");
                console.log(newDate);
                // getUserQuery = getUserQuery
                // .whereRaw(`DATE(j.appointment_start_date) <= ${newDate}`)
                // .whereRaw(`DATE(j.appointment_end_date) >= ${newDate}`)
                getUserQuery = getUserQuery
                    .andWhereRaw(`DATE(j.appointment_start_date) <= '${newDate}' AND DATE(j.appointment_end_date) >= '${newDate}'`);
                // .whereRaw(`DATE(j.appointment_end_date) >= ${newDate}`)
            }

            const selectMappings = {
                appointmentId: "j.appointment_id",
                consultantId: "u.user_id",
                consultantFirstName: "u.first_name",
                consultantLastName: "u.last_name",
                consultantPictureId: "p.picture_id",
                consultantPictureName: "p.file_name",
                consultantPictureLink: "u1.picture",
                clientId: "u1.user_id",
                clientFirstName: "u1.first_name",
                clientLastName: "u1.last_name",
                clientPictureId: "p1.picture_id",
                clientPictureName: "p1.file_name",
                clientPictureLink: "u1.picture",
                appointmentTitle: "j.appointment_title",
                appointmentStartDate: "j.appointment_start_date",
                appointmentEndDate: "j.appointment_end_date",
                appointmentStartTime: "j.appointment_start_time",
                appointmentEndTime: "j.appointment_end_time",
                appointmentStatus: "j.appointment_status",
                appointmentDescription: "j.appointment_description",
                createdDate: "j.created_date",
                upateddDate: "j.updated_date",
            };

            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName} - Search Appointments successfully: `, { query, resultCount: UserResult.length });
            return { ...UserResult, rows: UserResult.rows.sort((a, b) => b.appointmentId - a.appointmentId) };
        } catch (error) {
            fastify.log.error(`${apiName} - Error searching appointments: `, error);
            throw new Error('Error searching appointments');
        }
    });

    fastify.get('/get-dates', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchAppointment'
        const status = await fastify.lib.getLookUpId(fastify, STATUS, ACTIVECD);

        try {
            let getUserQuery = fastify.appdb('appointments as j')
                .innerJoin('users as u', 'u.user_id', 'j.recipient_id')
                .innerJoin('users as u1', 'u1.user_id', 'j.user_id')
                .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id')
                .leftJoin('pictures as p1', 'p1.picture_id', 'u1.picture_id')
                .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 'j.appointment_status')
                .where({ 'appointment_status': status });

            if (query.month) {
                const month = query.month;
                getUserQuery = getUserQuery.whereRaw(`MONTH(j.appointment_start_date) = ${month} `);
            }

            const selectMappings = {
                appointmentId: "j.appointment_id",
                consultantId: "u.user_id",
                appointmentStartDate: "j.appointment_start_date",
                appointmentEndDate: "j.appointment_end_date",
                createdDate: "j.created_date",
                upatedDate: "j.updated_date",
            };

            getUserQuery = getUserQuery.select(selectMappings);
            const userResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);
            const datesOfMonth = await fastify.lib.getAllUniqueDays(userResult.rows);
            fastify.log.info(`${apiName} - Search Appointments successfully: `, { query, resultCount: userResult.length });
            return { datesOfMonth: datesOfMonth, code: 200 };

        } catch (error) {
            fastify.log.error(`${apiName} - Error searching Appointments: `, error);
            throw new Error('Error searching Appointments');
        }
    });

}