const express = require('express');
const axios = require('axios');
const app = express();

app.use(express.static('public'));

app.get('/data', async (req, res) => {
    try {
        const url = 'https://live.douyin.com/webcast/ranklist/audience/?aid=6383&rank_type=30&a_bogus=E7RwBfuvdi6pXf6f51QLfY3q6f-3Yg-u0tLV/D2fLnvzML39HMPF9exoRWvvtoyjN4/kIebjy4haT3nprQAnM3DUHuXLUdQ2myYpKl5Q5xSSs1fee6m/rsJx-JUUFerM-JV3EcksqJKGKbjk09OJ4hrvPjoja3LkFk6FOoBX&room_id=7415230231613000500';
        const response = await axios.get(url);
        const data = response.data;
        const ranks = data.data.ranks;
        const result = ranks.map(rank => {
            const nickname = rank.user.nickname;
            const avatarUrl = rank.user.avatar_thumb && rank.user.avatar_thumb.url_list && rank.user.avatar_thumb.url_list.length > 0? rank.user.avatar_thumb.url_list[0] : null;
            const newImIconUrl = rank.user.pay_grade && rank.user.pay_grade.new_im_icon_with_level && rank.user.pay_grade.new_im_icon_with_level.url_list && rank.user.pay_grade.new_im_icon_with_level.url_list.length > 0? rank.user.pay_grade.new_im_icon_with_level.url_list[0] : null;
            const clubName = rank.user.fans_club && rank.user.fans_club.data? rank.user.fans_club.data.club_name : null;
            const badgeUrl = rank.user.fans_club && rank.user.fans_club.data && rank.user.fans_club.data.badge && rank.user.fans_club.data.badge.icons["2"] && rank.user.fans_club.data.badge.icons["2"].url_list && rank.user.fans_club.data.badge.icons["2"].url_list.length > 0? rank.user.fans_club.data.badge.icons["2"].url_list[0] : null;
            const secUid = rank.user.sec_uid;
            let badgeImageListV2FirstUrl = null;
            let badgeImageListV2ThirdUrl = null;
            if (rank.user.badge_image_list_v2 && rank.user.badge_image_list_v2.length > 0) {
                const firstBadge = rank.user.badge_image_list_v2[0];
                if (firstBadge && firstBadge.content && firstBadge.content.alternative_text === "房管勋章") {
                    badgeImageListV2FirstUrl = firstBadge.url_list && firstBadge.url_list.length > 0? firstBadge.url_list[0] : null;
                }
                const thirdBadge = rank.user.badge_image_list_v2[2];
                if (thirdBadge && thirdBadge.content && thirdBadge.content.alternative_text === "勋章") {
                    badgeImageListV2ThirdUrl = thirdBadge.url_list && thirdBadge.url_list.length > 0? thirdBadge.url_list[0] : null;
                }
            }
            return { nickname, avatarUrl, newImIconUrl, clubName, badgeUrl, secUid, badgeImageListV2FirstUrl, badgeImageListV2ThirdUrl };
        });
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