const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.static('public'));

// 尝试从环境变量中读取 room_ids，如果没有则设置一个默认空数组
const roomIdsFromEnv = process.env.ROOM_IDS ? process.env.ROOM_IDS.split(',').map(id => id.trim()) : [];

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
            return res.status(400).json({error: 'No room_id available.'});
        }
        const headers = {Cookie: '__ac_nonce=066ec02370071bd084ad3; __ac_signature=_02B4Z6wo00f01NWIYWwAAIDA4qylMgycwRjVqGXAAFOT51; ttwid=1%7CvdvIQJoVkF8iDYKVmGvM60Cl0_6GrNlTExV6SHGIp3Q%7C1726743095%7C6be2d83e98a929e46ba6331a9720f22895e0fd4540f15ccaa9e87b8cb237869a; x-web-secsdk-uid=f7cd8d30-aaa6-4d87-a3bf-13466324ebf0; __live_version__=%221.1.2.3765%22; has_avx2=null; device_web_cpu_core=12; device_web_memory_size=8; webcast_local_quality=null; live_can_add_dy_2_desktop=%220%22; live_use_vvc=%22false%22; hevc_supported=true; xgplayer_user_id=780526682221; csrf_session_id=227cd98361a82148016d1488a791d2c4; h265ErrorNum=-1; volume_info=%7B%22isMute%22%3Afalse%2C%22isUserMute%22%3Afalse%2C%22volume%22%3A0.6%7D; fpk1=U2FsdGVkX1+wP8hDqt31NIuHzyfrvzKd5XARPohdtgZ+VOrb3Ig+isjyKFreGHzIA1R07O7Nl8kZKnUl1I4Jtg==; fpk2=a565ccc5e7018c4ec7bec64e38db2966; FORCE_LOGIN=%7B%22videoConsumedRemainSeconds%22%3A180%7D; IsDouyinActive=false; xg_device_score=7.630007575365517'};
        const roomInfoResponse = await axios.get(`https://live.douyin.com/webcast/room/web/enter/?aid=6383&device_platform=web&browser_language=zh-CN&browser_platform=Win32&browser_name=Edge&browser_version=128.0.0.0&web_rid=${roomId}`, {headers});
        const roomInfoData = roomInfoResponse.data.data;
        const status = roomInfoData.data[0].status;
        let result;
        if (status === 2) {
            const idStr = roomInfoData.data[0].id_str;
            const url = `https://live.douyin.com/webcast/ranklist/audience/?aid=6383&rank_type=30&a_bogus=E7RwBfuvdi6pXf6f51QLfY3q6f-3Yg-u0tLV/D2fLnvzML39HMPF9exoRWvvtoyjN4/kIebjy4haT3nprQAnM3DUHuXLUdQ2myYpKl5Q5xSSs1fee6m/rsJx-JUUFerM-JV3EcksqJKGKbjk09OJ4hrvPjoja3LkFk6FOoBX&room_id=${idStr}`;
            const response = await axios.get(url);
            const data = response.data;
            const ranks = data.data.ranks;
            const anchorNickname = roomInfoData.user.nickname;
            const anchorAvatarUrl = roomInfoData.user.avatar_thumb && roomInfoData.user.avatar_thumb.url_list && roomInfoData.user.avatar_thumb.url_list.length > 0 ? roomInfoData.user.avatar_thumb.url_list[0] : "";
            const formattedData = {
                anchorNickname,
                anchorAvatarUrl,
                data: ranks.map(rank => ({
                    userNickname: rank.user.nickname,
                    avatarUrl: rank.user.avatar_thumb && rank.user.avatar_thumb.url_list && rank.user.avatar_thumb.url_list.length > 0 ? rank.user.avatar_thumb.url_list[0] : "",
                    payGrade: rank.user.pay_grade && rank.user.pay_grade.level ? rank.user.pay_grade.level : "",
                    payGradeIconUrl: rank.user.pay_grade && rank.user.pay_grade.new_im_icon_with_level && rank.user.pay_grade.new_im_icon_with_level.url_list && rank.user.pay_grade.new_im_icon_with_level.url_list.length > 0 ? rank.user.pay_grade.new_im_icon_with_level.url_list[0] : "",
                    clubName: rank.user.fans_club && rank.user.fans_club.data ? rank.user.fans_club.data.club_name : "",
                    clubLevel: rank.user.fans_club && rank.user.fans_club.data ? rank.user.fans_club.data.level : "",
                    clubbadgeUrl: rank.user.fans_club && rank.user.fans_club.data && rank.user.fans_club.data.badge && rank.user.fans_club.data.badge.icons["2"] && rank.user.fans_club.data.badge.icons["2"].url_list && rank.user.fans_club.data.badge.icons["2"].url_list.length > 0 ? rank.user.fans_club.data.badge.icons["2"].url_list[0] : "",
                    secUid: rank.user.sec_uid,
                    buffInfo: rank.user.pay_grade.buff_info ? rank.user.pay_grade.buff_info : "",
                    mysteryMan: rank.user.mystery_man,
                    badgeImageListV2FirstUrl: "",
                    badgeImageListV2ThirdUrl: ""
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
        res.status(500).json({error: 'Error fetching data'});
    }
});

const port = 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});