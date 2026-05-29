// Vercel serverless function for quotes API
// GET /api/quotes/random, GET /api/quotes/all

const QUOTES = [
  { text: '成功不是最终的，失败不是致命的：继续前进的勇气才是最重要的。', author: '丘吉尔' },
  { text: '时间就像海绵里的水，只要愿挤，总还是有的。', author: '鲁迅' },
  { text: '今天所做之事勿候明天，自己所做之事勿候他人。', author: '歌德' },
  { text: '不要等待机会，而要创造机会。', author: '培根' },
  { text: '千里之行，始于足下。', author: '老子' },
  { text: '成功是由日复一日的微小努力积累而成的。', author: '罗伯特·科利尔' },
  { text: '你的时间有限，不要浪费在模仿别人的生活上。', author: '乔布斯' },
  { text: '志当存高远。', author: '诸葛亮' },
  { text: '一分耕耘，一分收获。', author: '谚语' },
  { text: '学习是劳动，是充满思想的劳动。', author: '乌申斯基' },
  { text: '合理安排时间，就等于节约时间。', author: '培根' },
  { text: '业精于勤，荒于嬉。', author: '韩愈' },
  { text: '自律是自由的第一步。', author: '亚里士多德' },
  { text: '每一个不曾起舞的日子，都是对生命的辜负。', author: '尼采' },
  { text: '不积跬步，无以至千里；不积小流，无以成江海。', author: '荀子' },
  { text: '人的差异在于业余时间。', author: '爱因斯坦' },
  { text: '天行健，君子以自强不息。', author: '周易' },
  { text: '自律给我自由。', author: '康德' },
  { text: '真正的高贵是优于过去的自己。', author: '海明威' },
  { text: '专注是效率的灵魂。', author: '佚名' },
  { text: '最好的时机是现在。', author: '佚名' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '行动是治愈恐惧的良药。', author: '戴尔·卡耐基' },
  { text: '少壮不努力，老大徒伤悲。', author: '汉乐府' },
  { text: '成大事不在于力量的大小，而在于能坚持多久。', author: '约翰逊' },
  { text: '书山有路勤为径，学海无涯苦作舟。', author: '韩愈' },
  { text: '天才是百分之一的灵感加上百分之九十九的汗水。', author: '爱迪生' },
  { text: '学而不思则罔，思而不学则殆。', author: '孔子' },
  { text: '一日之计在于晨，一年之计在于春。', author: '谚语' },
  { text: '种一棵树最好的时间是十年前，其次是现在。', author: '非洲谚语' },
  { text: '伟大的成就源于每天的小进步。', author: '罗宾·夏玛' },
  { text: '当你觉得为时已晚的时候，恰恰是最早的时候。', author: '哈佛校训' },
  { text: '做一个行动派，而不是空想家。', author: '佚名' },
  { text: '人生在勤，不索何获。', author: '张衡' },
  { text: '时间是世界上一切成就的土壤。', author: '麦金西' },
  { text: '生活不止眼前的苟且，还有诗和远方。', author: '高晓松' },
  { text: '既然选择了远方，便只顾风雨兼程。', author: '汪国真' },
  { text: '希望是附丽于存在的，有存在，便有希望。', author: '鲁迅' },
  { text: '明日复明日，明日何其多。', author: '钱鹤滩' },
  { text: '专注和简单一直是我的秘诀之一。', author: '乔布斯' },
  { text: '知识就是力量。', author: '培根' },
  { text: '只有极其努力，才能看起来毫不费力。', author: '刘同' },
  { text: '滴水穿石不是靠力，而是因为不舍昼夜。', author: '奥维德' },
  { text: '一个人知道自己为什么而活，就可以忍受任何一种生活。', author: '尼采' },
  { text: '没有目标的努力，犹如在黑暗中远征。', author: '佚名' },
];

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const path = req.url.replace('/api/quotes', '');

  if (path === '/random' || path === '/random/') {
    const i = Math.floor(Math.random() * QUOTES.length);
    return res.json(QUOTES[i]);
  }

  if (path === '/all' || path === '/all/') {
    return res.json(QUOTES);
  }

  // Default: return random
  const i = Math.floor(Math.random() * QUOTES.length);
  return res.json(QUOTES[i]);
}
