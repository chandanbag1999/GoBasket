const User = require('../models/User');

// GET /api/v1/admin/users?search=&role=&page=&limit=
exports.searchUsers = async (req, res) => {
  let { search, role, page=1, limit=10 } = req.query;
  page = parseInt(page); limit = parseInt(limit);
  const query = { isActive:true };
  if (role) query.role = role;
  if (search) {
    const regex = new RegExp(search, 'i');
    query.$or = [{ name:regex },{ email:regex },{ phone:regex }];
  }
  const total = await User.countDocuments(query);
  const users = await User.find(query)
    .select('name email phone role avatar')
    .skip((page-1)*limit)
    .limit(limit)
    .sort({ createdAt:-1 });
  res.json({ success:true,
    pagination:{ total, page, limit, pages: Math.ceil(total/limit) },
    data: { users }
  });
};
