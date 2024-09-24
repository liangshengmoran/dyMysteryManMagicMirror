const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.static('public'));

// 尝试从环境变量中读取 room_ids，如果没有则设置一个默认空数组
const roomIdsFromEnv = process.env.ROOM_IDS
    ? process.env.ROOM_IDS.split(',').map(id => id.trim())
    : [];

app.get('/data', async (req, res) => {
    try {
        let roomId;
        if (req.query.room_id) {
            // 如果有直接传入的 room_id 参数，则使用该参数
            roomId = req.query.room_id;
        } else if (req.query.room && parseInt(req.query.room) > 0 && roomIdsFromEnv[parseInt(req.query.room) - 1]) {
            // 如果有指定从环境变量中选择的参数，则从环境变量中选择对应的 room_id
            roomId = roomIdsFromEnv[parseInt(req.query.room) - 1];
        } else if (roomIdsFromEnv.length > 0) {
            // 如果没有参数且环境变量中有 room_id，则使用环境变量中的第一个
            roomId = roomIdsFromEnv[0];
        } else {
            // 如果没有任何可用的 room_id，则返回错误信息
            return res.status(400).json({ error: 'No room_id available.' });
        }
        const headers = { Cookie: 'ttwid=1%7CvdvIQJoVkF8iDYKVmGvM60Cl0_6GrNlTExV6SHGIp3Q%7C1726743095%7C6be2d83e98a929e46ba6331a9720f22895e0fd4540f15ccaa9e87b8cb237869a; ' };
        const roomInfoResponse = await axios.get(`https://live.douyin.com/webcast/room/web/enter/?aid=6383&device_platform=web&browser_language=zh-CN&browser_platform=Win32&browser_name=Edge&browser_version=128.0.0.0&web_rid=${roomId}`, { headers });
        const roomInfoData = roomInfoResponse.data.data;
        const status = roomInfoData.data[0].status;
        let result;
        if (status === 2) {
            const idStr = roomInfoData.data[0].id_str;
            const LiveUserurl = await axios.get(`https://live.douyin.com/webcast/ranklist/audience/?aid=6383&rank_type=30&a_bogus=E7RwBfuvdi6pXf6f51QLfY3q6f-3Yg-u0tLV/D2fLnvzML39HMPF9exoRWvvtoyjN4/kIebjy4haT3nprQAnM3DUHuXLUdQ2myYpKl5Q5xSSs1fee6m/rsJx-JUUFerM-JV3EcksqJKGKbjk09OJ4hrvPjoja3LkFk6FOoBX&room_id=${idStr}`);
            const data = LiveUserurl.data;
            const ranks = data.data.ranks;
            const anchorNickname = roomInfoData.user.nickname;
            const anchorAvatarUrl = roomInfoData.user.avatar_thumb && roomInfoData.user.avatar_thumb.url_list && roomInfoData.user.avatar_thumb.url_list.length > 0? roomInfoData.user.avatar_thumb.url_list[0] : "";
            const anchorAvatarBorder = roomInfoData.data[0].owner&&roomInfoData.data[0].owner.border&&roomInfoData.data[0].owner.border.icon&&roomInfoData.data[0].owner.border.icon.url_list&&roomInfoData.data[0].owner.border.icon.url_list.length>0?roomInfoData.data[0].owner.border.icon.url_list[0]:"";
            const formattedData = {
                anchorNickname,
                anchorAvatarUrl,
                anchorAvatarBorder,
                data: await Promise.all(ranks.map(async rank => {
                    const badgeImageListV2 = rank.user.badge_image_list_v2 || [];
                    let VIPico = "";
                    let payGradeIconUrl = "";
                    let clubbadgeUrl = "";
                    let manageIconUrl = "";
                    let mysteryManIconUrl = "";
                    for (const item of badgeImageListV2) {
                        if (item.image_type === 59 && item.url_list.length > 0) {
                            VIPico = item.url_list[0];
                        }
                        if (item.image_type === 1 && item.url_list.length > 0) {
                            payGradeIconUrl = item.url_list[0];
                        }
                        if (item.image_type === 7 && item.url_list.length > 0) {
                            clubbadgeUrl = item.url_list[0];
                        }
                        if (item.image_type === 3 && item.url_list.length > 0) {
                            manageIconUrl = item.url_list[0];
                        }
                        if (item.image_type === 0 && item.url_list.length > 0) {
                            mysteryManIconUrl = item.url_list[0];
                        }
                    }
                    let Avatarframe = "";
                    if (rank.user.border && rank.user.border.icon && rank.user.border.icon.url_list.length > 0) {
                        Avatarframe = rank.user.border.icon.url_list[0];
                    }
                    if (rank.user.mystery_man === 2) {
                        const secUid = rank.user.sec_uid;
                        const userProfileResponse = await axios.get(`https://douapi.lsmr.nl/api/douyin/web/handler_user_profile?sec_user_id=${secUid}`);
                        const userProfileData = userProfileResponse.data.data.user;
                        return {
                            userNickname: rank.user.nickname,
                            avatarUrl: rank.user.avatar_thumb && rank.user.avatar_thumb.url_list && rank.user.avatar_thumb.url_list.length > 0? rank.user.avatar_thumb.url_list[0] : "",
                            payGrade: rank.user.pay_grade && rank.user.pay_grade.level? rank.user.pay_grade.level : "",
                            payGradeIconUrl,
                            clubName: rank.user.fans_club && rank.user.fans_club.data? rank.user.fans_club.data.club_name : "",
                            clubLevel: rank.user.fans_club && rank.user.fans_club.data? rank.user.fans_club.data.level : "",
                            clubbadgeUrl,
                            secUid: rank.user.sec_uid,
                            // buffInfo: rank.user.pay_grade.buff_info? rank.user.pay_grade.buff_info : "",
                            mysteryMan: rank.user.mystery_man,
                            Avatarframe,
                            VIPico,
                            manageIconUrl,
                            mysteryManIconUrl,
                            mysteryManInfoAvatar: userProfileData.avatar_300x300.url_list[0] || "",
                            mysteryManInfoNickname: userProfileData.nickname || "",
                            mysteryManInfoIp: userProfileData.ip_location || ""
                        };
                    } else {
                        return {
                            userNickname: rank.user.nickname,
                            avatarUrl: rank.user.avatar_thumb && rank.user.avatar_thumb.url_list && rank.user.avatar_thumb.url_list.length > 0? rank.user.avatar_thumb.url_list[0] : "",
                            payGrade: rank.user.pay_grade && rank.user.pay_grade.level? rank.user.pay_grade.level : "",
                            payGradeIconUrl,
                            clubName: rank.user.fans_club && rank.user.fans_club.data? rank.user.fans_club.data.club_name : "",
                            clubLevel: rank.user.fans_club && rank.user.fans_club.data? rank.user.fans_club.data.level : "",
                            clubbadgeUrl,
                            secUid: rank.user.sec_uid,
                            // buffInfo: rank.user.pay_grade.buff_info? rank.user.pay_grade.buff_info : "",
                            mysteryMan: rank.user.mystery_man,
                            Avatarframe,
                            VIPico,
                            manageIconUrl,
                            mysteryManIconUrl,
                            mysteryManInfoAvatar: "",
                            mysteryManInfoNickname: "",
                            mysteryManInfoIp: ""
                        };
                    }
                }))
            };
            result = [formattedData];
        } else if (status === 4) {
            result = {
                message: '直播已结束',
                anchorNickname: roomInfoData.user.nickname,
                anchorAvatarUrl: roomInfoData.user.avatar_thumb.url_list[0]
            };
        }
        res.json(result);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ error: 'Error fetching data' });
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});