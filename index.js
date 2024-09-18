const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.static('public'));

// 尝试从环境变量中读取 room_ids，如果没有则设置一个默认空数组
const roomIdsFromEnv = process.env.ROOM_IDS? process.env.ROOM_IDS.split(',').map(id => id.trim()) : [];

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

        const roomInfoResponse = await axios.get(`https://live.douyin.com/webcast/room/info_by_scene/?aid=6383&scene=douyin_pc_search&room_id=${roomId}`);
        const roomInfoData = roomInfoResponse.data.data;
        const status = roomInfoData.status;
        let result;
        if (status === 2) {
            const url = `https://live.douyin.com/webcast/ranklist/audience/?aid=6383&rank_type=30&a_bogus=E7RwBfuvdi6pXf6f51QLfY3q6f-3Yg-u0tLV/D2fLnvzML39HMPF9exoRWvvtoyjN4/kIebjy4haT3nprQAnM3DUHuXLUdQ2myYpKl5Q5xSSs1fee6m/rsJx-JUUFerM-JV3EcksqJKGKbjk09OJ4hrvPjoja3LkFk6FOoBX&room_id=${roomId}`;
            const response = await axios.get(url);
            const data = response.data;
            const ranks = data.data.ranks;
            const anchorNickname = roomInfoData.owner.nickname;
            const anchorAvatarUrl = roomInfoData.owner.avatar_thumb && roomInfoData.owner.avatar_thumb.url_list && roomInfoData.owner.avatar_thumb.url_list.length > 0? roomInfoData.owner.avatar_thumb.url_list[0] : "";
            const userCountStr = roomInfoData.stats.user_count_str;
            const formattedData = {
                anchorNickname,
                anchorAvatarUrl,
                userCountStr,
                data: ranks.map(rank => ({
                    userNickname: rank.user.nickname,
                    avatarUrl: rank.user.avatar_thumb && rank.user.avatar_thumb.url_list && rank.user.avatar_thumb.url_list.length > 0? rank.user.avatar_thumb.url_list[0] : "",
                    payGrade: rank.user.pay_grade && rank.user.pay_grade.level? rank.user.pay_grade.level : "",
                    payGradeIconUrl: rank.user.pay_grade && rank.user.pay_grade.new_im_icon_with_level && rank.user.pay_grade.new_im_icon_with_level.url_list && rank.user.pay_grade.new_im_icon_with_level.url_list.length > 0? rank.user.pay_grade.new_im_icon_with_level.url_list[0] : "",
                    clubName: rank.user.fans_club && rank.user.fans_club.data? rank.user.fans_club.data.club_name : "",
                    clubLevel: rank.user.fans_club && rank.user.fans_club.data? rank.user.fans_club.data.level : "",
                    clubbadgeUrl: rank.user.fans_club && rank.user.fans_club.data && rank.user.fans_club.data.badge && rank.user.fans_club.data.badge.icons["2"] && rank.user.fans_club.data.badge.icons["2"].url_list && rank.user.fans_club.data.badge.icons["2"].url_list.length > 0? rank.user.fans_club.data.badge.icons["2"].url_list[0] : "",
                    secUid: rank.user.sec_uid,
                    buffInfo: rank.user.pay_grade.buff_info? rank.user.pay_grade.buff_info : "",
                    mysteryMan: rank.user.mystery_man,
                    badgeImageListV2FirstUrl: "",
                    badgeImageListV2ThirdUrl: ""
                }))
            };
            result = [formattedData];
        } else if (status === 4) {
            result = {
                message: '直播已结束',
                anchorNickname: roomInfoData.owner.nickname,
                anchorAvatarUrl: roomInfoData.owner.avatar_thumb.url_list[0]
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