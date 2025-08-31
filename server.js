const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Biến lưu trữ trạng thái game
let gameSession = {
  isActive: false,
  startTime: null,
  endTime: null
};

// Biến lưu trữ kết quả từ users
let gameResults = [];

// Biến lưu trữ người chơi đã kết nối (đăng nhập)
let connectedPlayers = new Set();

// ======== GAME SESSION APIs ========

// POST - LanAnhT02 bắt đầu game
app.post('/api/game/start', (req, res) => {
  try {
    const { user } = req.body;
    
    // Kiểm tra phải là LanAnhT02
    if (user.username !== 'LanAnhT02' || user.fullname !== 'Lan Anh') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ LanAnhT02 mới có quyền bắt đầu game!'
      });
    }
    
    // Bắt đầu game mới
    gameSession = {
      isActive: true,
      startTime: new Date().toISOString(),
      endTime: null
    };
    
    // Reset kết quả cũ
    gameResults = [];
    
    // Reset danh sách người chơi kết nối
    connectedPlayers.clear();
    
    console.log('🎮 Game đã bắt đầu bởi LanAnhT02');
    
    res.json({
      success: true,
      message: 'Game đã bắt đầu!',
      session: gameSession
    });
  } catch (error) {
    console.error('❌ Lỗi khi bắt đầu game:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// POST - LanAnhT02 kết thúc game
app.post('/api/game/end', (req, res) => {
  try {
    const { user } = req.body;
    
    // Kiểm tra phải là LanAnhT02
    if (user.username !== 'LanAnhT02' || user.fullname !== 'Lan Anh') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ LanAnhT02 mới có quyền kết thúc game!'
      });
    }
    
    // Kết thúc game
    gameSession.isActive = false;
    gameSession.endTime = new Date().toISOString();
    
    console.log('🏁 Game đã kết thúc bởi LanAnhT02');
    
    res.json({
      success: true,
      message: 'Game đã kết thúc!',
      session: gameSession,
      results: gameResults
    });
  } catch (error) {
    console.error('❌ Lỗi khi kết thúc game:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// GET - Kiểm tra trạng thái game
app.get('/api/game/status', (req, res) => {
  try {
    res.json({
      success: true,
      session: gameSession
    });
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra trạng thái game:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// ======== PLAYER CONNECTION APIs ========

// POST - Theo dõi người chơi đăng nhập
app.post('/api/player/connect', (req, res) => {
  try {
    const { user } = req.body;
    
    // Thêm người chơi vào danh sách kết nối
    const playerKey = `${user.username}|${user.fullname}`;
    connectedPlayers.add(playerKey);
    
    console.log(`👤 Người chơi đã kết nối: ${user.fullname} (${user.username})`);
    console.log(`👥 Tổng số người chơi đang kết nối: ${connectedPlayers.size}`);
    
    res.json({
      success: true,
      message: 'Đã ghi nhận kết nối',
      connectedPlayers: connectedPlayers.size
    });
  } catch (error) {
    console.error('❌ Lỗi khi theo dõi kết nối người chơi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// GET - Lấy danh sách người chơi đã kết nối
app.get('/api/players/connected', (req, res) => {
  try {
    // Chuyển Set thành Array để gửi về frontend
    const playersArray = Array.from(connectedPlayers).map(playerKey => {
      const [username, fullname] = playerKey.split('|');
      return { username, fullname };
    });
    
    res.json({
      success: true,
      players: playersArray,
      count: playersArray.length
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy danh sách người chơi:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// ======== GAME RESULTS APIs ========

// POST - User gửi kết quả (chỉ khi game đang active)
app.post('/api/results', (req, res) => {
  try {
    // Kiểm tra game có đang active không
    if (!gameSession.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Game chưa bắt đầu hoặc đã kết thúc!'
      });
    }
    
    const data = req.body;
    
    // Thêm kết quả vào danh sách
    const result = {
      ...data,
      submittedAt: new Date().toISOString()
    };
    
    gameResults.push(result);
    
    console.log(`✅ Nhận kết quả từ ${data.user.fullname}`);
    
    res.json({
      success: true,
      message: 'Kết quả đã được lưu!'
    });
  } catch (error) {
    console.error('❌ Lỗi khi nhận kết quả:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// GET - Lấy tất cả kết quả (cho LanAnhT02)
app.get('/api/results', (req, res) => {
  try {
    res.json({
      success: true,
      results: gameResults,
      count: gameResults.length
    });
  } catch (error) {
    console.error('❌ Lỗi khi lấy kết quả:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server'
    });
  }
});

// ======== HEALTH CHECK ========
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend đang hoạt động',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Multiplayer Drag & Drop Game Backend',
    endpoints: {
      'POST /api/game/start': 'LanAnhT02 bắt đầu game',
      'POST /api/game/end': 'LanAnhT02 kết thúc game',
      'GET /api/game/status': 'Kiểm tra trạng thái game',
      'POST /api/player/connect': 'Theo dõi người chơi đăng nhập',
      'GET /api/players/connected': 'Lấy danh sách người chơi đã kết nối',
      'POST /api/results': 'User gửi kết quả',
      'GET /api/results': 'Lấy tất cả kết quả',
      'GET /api/health': 'Kiểm tra trạng thái'
    }
  });
});

app.listen(PORT, () => {
  console.log(`🟢 Backend đang chạy tại port ${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   POST /api/game/start`);
  console.log(`   POST /api/game/end`);
  console.log(`   GET  /api/game/status`);
  console.log(`   POST /api/player/connect`);
  console.log(`   GET  /api/players/connected`);
  console.log(`   POST /api/results`);
  console.log(`   GET  /api/results`);
});