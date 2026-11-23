function readSavedCampusSpot() {
    try { return localStorage.getItem('hq.campusSpot') || ''; } catch (e) { return ''; }
}

var state = {
    me: null,
    token: '',
    home: {category: '', condition: '', tradeMode: 0, sort: '', campusSpot: readSavedCampusSpot(), minCredit: 0, maxPrice: 2000, keyword: '', page: 1, items: [], total: 0, hasMore: false},
    idleTab: 'all',
    idleCache: {auctions: null, myRelay: null, wishes: null, myShelf: null},
    publishImages: [],
    _pickedOfferItemId: 0,
    offersTab: 'received',
    offersQuery: '',
    offersAdvOpen: false,
    offersStatusFilter: 'all',
    hiddenDemoOrders: [],
    meFilter: 'all',
    relayCat: '全部',
    auctionCat: '全部',
    auctionState: '全部',
    auctionSort: 'default',
    wishCat: '全部',
    activeImKey: '',
    commRoom: 'hall',
    commTab: 'posts',
    tiebaPostImg: '',
    tiebaOpenComments: {},
    adminTab: 'dashboard', adminUserQuery: '', adminReportStatus: 0
};

const desktopRuntime = {
    loadingMoreItems: false,
    imPollTimer: null,
    roomTimer: null,
    communityTimer: null,
    currentView: {name: 'home', arg: null},
    imDraggedRow: null,
};

export { desktopRuntime, readSavedCampusSpot, state };
