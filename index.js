const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.static('public'));

app.get('/data', async (req, res) => {
    try {
        // 请求直播状态接口
        const roomInfoResponse = await axios.get('https://live.douyin.com/webcast/room/info_by_scene/?aid=6383&scene=douyin_pc_search&room_id=7415854224678193939');
        const roomInfoData = roomInfoResponse.data.data;
        const status = roomInfoData.status;
        let result;
        if (status === 2) {
            // 获取抖音直播间排名数据
            const url = 'https://live.douyin.com/webcast/ranklist/audience/?aid=6383&rank_type=30&a_bogus=E7RwBfuvdi6pXf6f51QLfY3q6f-3Yg-u0tLV/D2fLnvzML39HMPF9exoRWvvtoyjN4/kIebjy4haT3nprQAnM3DUHuXLUdQ2myYpKl5Q5xSSs1fee6m/rsJx-JUUFerM-JV3EcksqJKGKbjk09OJ4hrvPjoja3LkFk6FOoBX&room_id=7415854224678193939';
            const response = await axios.get(url);
            const data = response.data;
            const ranks = data.data.ranks;
            const anchorNickname = roomInfoData.owner.nickname;
            const anchorAvatarUrl = roomInfoData.owner.avatar_thumb && roomInfoData.owner.avatar_thumb.url_list && roomInfoData.owner.avatar_thumb.url_list.length > 0 ? roomInfoData.owner.avatar_thumb.url_list[0] : "";
            const userCountStr = roomInfoData.stats.user_count_str;
            const formattedData = {
                //主播昵称
                anchorNickname,
                //主播头像链接
                anchorAvatarUrl,
                userCountStr,
                data: ranks.map(rank => ({
                    //用户昵称
                    userNickname: rank.user.nickname,
                    // 用户头像链接
                    avatarUrl: rank.user.avatar_thumb && rank.user.avatar_thumb.url_list && rank.user.avatar_thumb.url_list.length > 0 ? rank.user.avatar_thumb.url_list[0] : "",
                    // 用户荣誉等级
                    payGrade: rank.user.pay_grade && rank.user.pay_grade.level ? rank.user.pay_grade.level : "",
                    // 荣誉等级图标
                    payGradeIconUrl: rank.user.pay_grade && rank.user.pay_grade.new_im_icon_with_level && rank.user.pay_grade.new_im_icon_with_level.url_list && rank.user.pay_grade.new_im_icon_with_level.url_list.length > 0 ? rank.user.pay_grade.new_im_icon_with_level.url_list[0] : "",
                    // 灯牌昵称
                    clubName: rank.user.fans_club && rank.user.fans_club.data ? rank.user.fans_club.data.club_name : "",
                    // 灯牌等级
                    clubLevel: rank.user.fans_club && rank.user.fans_club.data ? rank.user.fans_club.data.level : "",
                    // 灯牌图标链接
                    clubbadgeUrl: rank.user.fans_club && rank.user.fans_club.data && rank.user.fans_club.data.badge && rank.user.fans_club.data.badge.icons["2"] && rank.user.fans_club.data.badge.icons["2"].url_list && rank.user.fans_club.data.badge.icons["2"].url_list.length > 0 ? rank.user.fans_club.data.badge.icons["2"].url_list[0] : "",
                    // 用户UID
                    secUid: rank.user.sec_uid,
                    // isFollow: rank.user.is_follow,
                    //加速等级buff信息
                    buffInfo: rank.user.pay_grade.buff_info ? rank.user.pay_grade.buff_info : "",
                    // 是否是神秘人 1 否 2 是
                    mysteryMan: rank.user.mystery_man,
                    badgeImageListV2FirstUrl: "",
                    badgeImageListV2ThirdUrl: ""
                }))
            };
            result = [formattedData];
        } else if (status === 4) {
            // 直播结束，直接返回包含“直播结束”和昵称的 JSON 数据，并添加默认的 anchorNickname
            result = {
                message: '直播已结束',
                anchorNickname: roomInfoData.owner.nickname,
                anchorAvatarUrl: roomInfoData.owner.avatar_thumb.url_list[0]
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