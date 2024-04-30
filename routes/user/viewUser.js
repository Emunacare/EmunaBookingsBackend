const moment = require('moment');

module.exports = async function searchUser(fastify, opts) {

    fastify.get('/search', async (request, reply) => {
        const { query } = request;
        const apiName = 'searchUser'
        try {
            let getUserQuery = fastify.appdb('users as u')
                .innerJoin('lookup_details as ld', 'ld.lookup_dtl_id', 'u.role_id')
                .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 'u.status_id')
                .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id');

            if (query.name) {
                let filterName = String(query.name).replace(/\s/g, '');
                getUserQuery = getUserQuery.whereRaw(`CONCAT(u.first_name, u.last_name) LIKE '%${filterName}%'`);
            }

            const selectMappings = {
                userId: "u.user_id",
                firstName: "u.first_name",
                lastName: "u.last_name",
                officePhone: "u.office_phone",
                personalPhone: "u.personal_phone",
                personalEmail: "u.personal_email",
                officeEmail: "u.office_email",
                pictureId: "p.picture_id",
                pictureName: "p.file_name",
                pictureLink: "u.picture",
                position: "u.position",
                description: "u.about",
                address: "u.address",
                statusId: 'ld1.lookup_dtl_id',
                status: 'ld1.dtl_desc',
                roleId: "ld.lookup_dtl_id",
                role: "ld.dtl_desc",
                createdDate: "u.created_date",
            }

            getUserQuery = getUserQuery.select(selectMappings);
            const UserResult = await fastify.lib.selectMultiRow(request, reply, getUserQuery);

            fastify.log.info(`${apiName}-Search Users successfully:`, { query, resultCount: UserResult.length });
            return { ...UserResult, rows: UserResult.rows.sort((a, b) => b.userId - a.userId) };
        } catch (error) {
            fastify.log.error(`${apiName}-Error searching users:`, error);
            throw new Error('Error searching users');
        }
    });

    fastify.get('/search/:id', async (request, reply) => {
        const { params } = request;
        const apiName = 'searchUserById'
        if (!params.id) {
            reply.code(400);
            return fastify.lib.returnMessage('User ID is missing!', 400);
        }
        // console.log(params.id)
        // try {
        let getUserQuery = fastify.appdb('users as u')
            .innerJoin('lookup_details as ld', 'ld.lookup_dtl_id', 'u.role_id')
            .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 'u.status_id')
            .innerJoin('appointments as a', 'a.recipient_id', 'u.user_id')
            .innerJoin('social_media_links as s', 's.user_id', 'u.user_id')
            .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id')
            .where({ 'u.user_id': params.id });
        // const todayDate = moment(new Date()).format("YYYY-MM-DD");

        // console.log(todayDate);
        // let getUserQueryInProcessDate = fastify.appdb('users as u')
        //     .innerJoin('appointments as a', 'a.recipient_id', 'u.user_id')
        //     .andWhereRaw(`DATE(j.appointment_start_date) <= DATE('${newDate}') AND DATE(j.appointment_end_date) >= DATE('${newDate}')`);
        // let getUserQueryAssignedDate = fastify.appdb('users as u')
        //     .innerJoin('appointments as a', 'a.recipient_id', 'u.user_id')
        //     .whereRaw(`DATE(appointment_start_date) >=  DATE(appointment_end_date)`)



        const selectMappings = {
            userId: "u.user_id",
            firstName: "u.first_name",
            lastName: "u.last_name",
            officePhone: "u.office_phone",
            personalPhone: "u.personal_phone",
            personalEmail: "u.personal_email",
            officeEmail: "u.office_email",
            pictureId: "p.picture_id",
            pictureName: "p.file_name",
            pictureLink: "u.picture",
            position: "u.position",
            profileAbout: "u.about",
            address: "u.address",
            statusId: 'ld1.lookup_dtl_id',
            status: 'ld1.dtl_desc',
            roleId: "ld.lookup_dtl_id",
            role: "ld.dtl_desc",
            createdDate: "u.created_date",
            socialLinkId: "s.social_link_id"
        };
        const selectMappingsDate = {
            appointmentId: 'a.appointment_id'
        }
        getUserQuery = getUserQuery.select(selectMappings);
        // getUserQueryInProcessDate = getUserQueryInProcessDate.select(selectMappingsDate);
        // getUserQueryAssignedDate = getUserQueryAssignedDate.select(selectMappingsDate);

        const UserResult = await fastify.lib.selectSingleRow(request, reply, getUserQuery);
        // const UserResult2 = await fastify.lib.selectMultiRow(request, reply, getUserQueryInProcessDate);
        // const UserResult3 = await fastify.lib.selectMultiRow(request, reply, getUserQueryAssignedDate);


        // const addedSocialLinks = {
        //     ...UserResult,
        //     socialMediaLinks: socialLinkResult && socialLinkResult.result && socialLinkResult.result
        // }
        fastify.log.info(`${apiName}-Search User by ID successfully:`, { id: params.id });
        return UserResult;
        // } catch (error) {
        //     fastify.log.error(`${apiName}-Error searching User by ID:`, error);
        //     throw new Error('Error searching User by ID');
        // }
    });

    fastify.get('/jobhistory', async (request, reply) => {
        const { query } = request;
        const apiName = 'jobHistory';
        if (!query.userId) {
            reply.code(400);
            return fastify.lib.returnMessage('User id is missing!', 400);
        }

        try {
            let getJobHistoryQuery = fastify.appdb('appointments as j')
                .innerJoin('users as u', 'u.user_id', 'j.recipient_id')
                .innerJoin('users as u1', 'u1.user_id', 'j.user_id')
                .leftJoin('pictures as p', 'p.picture_id', 'u.picture_id')
                .leftJoin('pictures as p1', 'p1.picture_id', 'u1.picture_id')
                .innerJoin('lookup_details as ld1', 'ld1.lookup_dtl_id', 'j.appointment_status')
                .where({ 'j.recipient_id': query.userId });

            const selectMappings = {
                jobId: "j.appointment_id",
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
                appointmentId: "j.appointment_id",
                appointmentStartDate: "j.appointment_start_date",
                appointmentEndDate: "j.appointment_end_date",
                appointmentStartTime: "j.appointment_start_time",
                appointmentEndTime: "j.appointment_end_time",
                appointmentStatus: "j.appointment_status",
                appointmentDescription: "j.appointment_description",
                createdDate: "j.created_date",
                upatedDate: "j.updated_date",
            }

            getJobHistoryQuery = getJobHistoryQuery.select(selectMappings).orderBy('j.appointment_id', 'desc');
            const jobHistoryResult = await fastify.lib.selectMultiRow(request, reply, getJobHistoryQuery);

            fastify.log.info(`${apiName}-Get Appointment history successfully:`, { userId: query.userId, fromDate: query.fromDate, toDate: query.toDate });
            return jobHistoryResult;
        } catch (error) {
            fastify.log.error(`${apiName}-Error getting Appointment history:`, error);
            throw new Error('Error getting job history');
        }
    });

}
