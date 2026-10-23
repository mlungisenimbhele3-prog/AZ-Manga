import 'package:flutter/material.dart';
import 'responsive_layout.dart';

/// Manga model representing a series on KA+ Africa Pulse
class MangaItem {
  final String id;
  final String title;
  final String author;
  final String coverUrl;
  final String bannerUrl;
  final String genre;
  final double rating;
  final String chapterCount;
  final bool isVip;
  final bool isFeatured;
  final String synopsis;

  const MangaItem({
    required this.id,
    required this.title,
    required this.author,
    required this.coverUrl,
    required this.bannerUrl,
    required this.genre,
    required this.rating,
    required this.chapterCount,
    this.isVip = false,
    this.isFeatured = false,
    this.synopsis = '',
  });
}

final List<MangaItem> sampleMangaList = [
  const MangaItem(
    id: '1',
    title: 'Sons of Shaka: Lightning Blade',
    author: 'Kagiso Mokoena',
    coverUrl: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1200&auto=format&fit=crop&q=80',
    genre: 'Action / Shonen',
    rating: 4.95,
    chapterCount: '24 Chapters',
    isVip: true,
    isFeatured: true,
    synopsis: 'In an alternate neo-Zululand, an orphaned spear-wielder discovers the ancient Lightning Sigil hidden inside the Drakensberg mountains.',
  ),
  const MangaItem(
    id: '2',
    title: 'Cape Cyberpunk 2099',
    author: 'Zola Dlamini',
    coverUrl: 'https://images.unsplash.com/photo-1563089145-599997674d42?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    genre: 'Sci-Fi / Mecha',
    rating: 4.88,
    chapterCount: '18 Chapters',
    isVip: false,
    isFeatured: false,
    synopsis: 'Under the neon lights of Table Mountain, augmented detectives hunt rogue AI entities threatening the mother city grid.',
  ),
  const MangaItem(
    id: '3',
    title: 'Spirit Hunters of the Kalahari',
    author: 'Naledi Sithole',
    coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1200&auto=format&fit=crop&q=80',
    genre: 'Supernatural',
    rating: 4.92,
    chapterCount: '12 Chapters',
    isVip: true,
    isFeatured: false,
    synopsis: 'Ancient sand spirits reawaken across the red dunes, demanding pacts with youth chosen by desert constellations.',
  ),
  const MangaItem(
    id: '4',
    title: 'Soweto Rhythm & Steel',
    author: 'Sipho Zulu',
    coverUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&auto=format&fit=crop&q=80',
    genre: 'Urban Fantasy',
    rating: 4.79,
    chapterCount: '30 Chapters',
    isVip: false,
    isFeatured: false,
    synopsis: 'High-octane musical alchemy and street brawls in Johannesburg townships.',
  ),
  const MangaItem(
    id: '5',
    title: 'Iron Shield of Pretoria',
    author: 'Thabo Mthembu',
    coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80',
    genre: 'Mecha / Action',
    rating: 4.85,
    chapterCount: '16 Chapters',
    isVip: true,
    isFeatured: false,
    synopsis: 'Gargantuan titanium golems defend the administrative capital from seismic rifts.',
  ),
  const MangaItem(
    id: '6',
    title: 'Sun Oracle of Durban',
    author: 'Ayanda Khumalo',
    coverUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=1200&auto=format&fit=crop&q=80',
    genre: 'Fantasy / Magic',
    rating: 4.91,
    chapterCount: '21 Chapters',
    isVip: false,
    isFeatured: false,
    synopsis: 'Harnessing the oceanic sun rays along the Golden Mile to protect ancestral treasures.',
  ),
  const MangaItem(
    id: '7',
    title: 'Midnight Taxi: Night Hunter',
    author: 'Bandile Khanyile',
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80',
    genre: 'Mystery / Thriller',
    rating: 4.76,
    chapterCount: '15 Chapters',
    isVip: false,
    isFeatured: false,
    synopsis: 'A phantom minibus taxi picking up souls and fighting nocturnal creatures on the N1 highway.',
  ),
  const MangaItem(
    id: '8',
    title: 'Highveld Alchemist',
    author: 'Nolwazi Dube',
    coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    bannerUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=1200&auto=format&fit=crop&q=80',
    genre: 'Adventure',
    rating: 4.89,
    chapterCount: '28 Chapters',
    isVip: true,
    isFeatured: false,
    synopsis: 'Synthesizing gold and solar energy from the Witwatersrand minerals in a secret academy.',
  ),
];

/// The main HomeScreen using ResponsiveLayout
class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedNavIndex = 0;
  String _searchQuery = '';
  String _selectedGenre = 'All';

  void _onNavTap(int index) {
    setState(() {
      _selectedNavIndex = index;
    });
  }

  void _onSearchChanged(String value) {
    setState(() {
      _searchQuery = value;
    });
  }

  void _onGenreSelected(String genre) {
    setState(() {
      _selectedGenre = genre;
    });
  }

  List<MangaItem> get filteredManga {
    return sampleMangaList.where((m) {
      final matchesQuery = _searchQuery.isEmpty ||
          m.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
          m.author.toLowerCase().contains(_searchQuery.toLowerCase());
      final matchesGenre = _selectedGenre == 'All' || m.genre.contains(_selectedGenre);
      return matchesQuery && matchesGenre;
    }).toList();
  }

  MangaItem get featuredManga {
    return sampleMangaList.firstWhere(
      (m) => m.isFeatured,
      orElse: () => sampleMangaList.first,
    );
  }

  @override
  Widget build(BuildContext context) {
    return ResponsiveLayout(
      mobileView: MobileHome(
        mangaList: filteredManga,
        featuredManga: featuredManga,
        searchQuery: _searchQuery,
        selectedGenre: _selectedGenre,
        onSearchChanged: _onSearchChanged,
        onGenreSelected: _onGenreSelected,
        selectedNavIndex: _selectedNavIndex,
        onNavTap: _onNavTap,
      ),
      desktopView: DesktopHome(
        mangaList: filteredManga,
        featuredManga: featuredManga,
        searchQuery: _searchQuery,
        selectedGenre: _selectedGenre,
        onSearchChanged: _onSearchChanged,
        onGenreSelected: _onGenreSelected,
        selectedNavIndex: _selectedNavIndex,
        onNavTap: _onNavTap,
      ),
    );
  }
}

// ============================================================================
// DESKTOP HOME VIEW (Width > 800px)
// Layout: [Left Sidebar] | [Middle Search + Upload + 4 Manga/Row] | [Right Featured Banner]
// ============================================================================

class DesktopHome extends StatelessWidget {
  final List<MangaItem> mangaList;
  final MangaItem featuredManga;
  final String searchQuery;
  final String selectedGenre;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String> onGenreSelected;
  final int selectedNavIndex;
  final ValueChanged<int> onNavTap;

  const DesktopHome({
    Key? key,
    required this.mangaList,
    required this.featuredManga,
    required this.searchQuery,
    required this.selectedGenre,
    required this.onSearchChanged,
    required this.onGenreSelected,
    required this.selectedNavIndex,
    required this.onNavTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      body: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // -------------------------------------------------------------
          // LEFT SIDEBAR: Logo + Home / Studio / Wallet (Vertical)
          // -------------------------------------------------------------
          Container(
            width: 250,
            decoration: const BoxDecoration(
              color: Color(0xFF0F1420),
              border: Border(
                right: BorderSide(color: Color(0xFF1E293B), width: 1),
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Top Brand & Logo
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                  child: Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [Color(0xFFF59E0B), Color(0xFFDC2626)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFFF59E0B).withOpacity(0.3),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: const Icon(
                          Icons.local_fire_department,
                          color: Colors.white,
                          size: 24,
                        ),
                      ),
                      const SizedBox(width: 12),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: const [
                          Text(
                            'KA+ PULSE',
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 18,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.5,
                            ),
                          ),
                          Text(
                            'MANGA MAGAZINE',
                            style: TextStyle(
                              color: Color(0xFFF59E0B),
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              letterSpacing: 1.2,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                const Divider(color: Color(0xFF1E293B), height: 1),
                const SizedBox(height: 16),

                // Navigation Items: Home / Studio / Wallet
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Padding(
                        padding: EdgeInsets.only(left: 12, bottom: 8),
                        child: Text(
                          'MAIN NAVIGATION',
                          style: TextStyle(
                            color: Color(0xFF64748B),
                            fontSize: 10,
                            fontWeight: FontWeight.w800,
                            letterSpacing: 1.0,
                          ),
                        ),
                      ),
                      _SidebarNavItem(
                        icon: Icons.auto_stories_rounded,
                        label: 'Home / Readers',
                        isSelected: selectedNavIndex == 0,
                        onTap: () => onNavTap(0),
                        badge: 'FREE',
                        badgeColor: const Color(0xFFF59E0B),
                      ),
                      _SidebarNavItem(
                        icon: Icons.create_rounded,
                        label: 'Creator Studio',
                        isSelected: selectedNavIndex == 1,
                        onTap: () => onNavTap(1),
                        badge: '70% REV',
                        badgeColor: const Color(0xFF10B981),
                      ),
                      _SidebarNavItem(
                        icon: Icons.account_balance_wallet_rounded,
                        label: 'Wallet & Payouts',
                        isSelected: selectedNavIndex == 2,
                        onTap: () => onNavTap(2),
                        badge: 'ZAR',
                        badgeColor: const Color(0xFF8B5CF6),
                      ),
                      _SidebarNavItem(
                        icon: Icons.emoji_events_rounded,
                        label: "Awards '26",
                        isSelected: selectedNavIndex == 3,
                        onTap: () => onNavTap(3),
                        badge: 'GALA',
                        badgeColor: const Color(0xFFFBBF24),
                      ),
                    ],
                  ),
                ),

                const Spacer(),

                // VIP Pass Card in Sidebar
                Container(
                  margin: const EdgeInsets.all(16),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: [Color(0xFF3B0764), Color(0xFF1E1B4B)],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF9333EA).withOpacity(0.4)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: const [
                          Icon(Icons.workspace_premium, color: Color(0xFFFBBF24), size: 18),
                          SizedBox(width: 6),
                          Text(
                            'VIP Pass Active',
                            style: TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'Zero banner ads, early chapter drops, & offline reading.',
                        style: TextStyle(
                          color: Color(0xFFE2E8F0),
                          fontSize: 11,
                          height: 1.3,
                        ),
                      ),
                      const SizedBox(height: 10),
                      Container(
                        width: double.infinity,
                        padding: const EdgeInsets.symmetric(vertical: 6),
                        decoration: BoxDecoration(
                          color: const Color(0xFF9333EA),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        alignment: Alignment.center,
                        child: const Text(
                          'Manage Plan',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // -------------------------------------------------------------
          // MIDDLE SECTION: Search Bar + [Upload] Button + Manga Grid 4 Cols
          // -------------------------------------------------------------
          Expanded(
            flex: 5,
            child: Container(
              color: const Color(0xFF0A0D14),
              child: CustomScrollView(
                slivers: [
                  // Middle Header: Search bar + Upload button
                  SliverToBoxAdapter(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              // Search input
                              Expanded(
                                child: Container(
                                  height: 48,
                                  decoration: BoxDecoration(
                                    color: const Color(0xFF131927),
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: const Color(0xFF1E293B),
                                    ),
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 16),
                                  child: Row(
                                    children: [
                                      const Icon(
                                        Icons.search_rounded,
                                        color: Color(0xFF64748B),
                                        size: 20,
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: TextField(
                                          onChanged: onSearchChanged,
                                          style: const TextStyle(
                                            color: Colors.white,
                                            fontSize: 14,
                                          ),
                                          decoration: InputDecoration(
                                            hintText: 'Search manga series, creators, genres...',
                                            hintStyle: const TextStyle(
                                              color: Color(0xFF64748B),
                                              fontSize: 13,
                                            ),
                                            border: InputBorder.none,
                                            isDense: true,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                              const SizedBox(width: 16),

                              // [Upload] Button
                              ElevatedButton.icon(
                                onPressed: () {
                                  ScaffoldMessenger.of(context).showSnackBar(
                                    const SnackBar(
                                      content: Text('Opening Manga Publishing Studio...'),
                                      backgroundColor: Color(0xFF10B981),
                                    ),
                                  );
                                },
                                icon: const Icon(Icons.cloud_upload_rounded, size: 18),
                                label: const Text(
                                  'Upload',
                                  style: TextStyle(
                                    fontWeight: FontWeight.w900,
                                    fontSize: 13,
                                    letterSpacing: 0.5,
                                  ),
                                ),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFFF59E0B),
                                  foregroundColor: Colors.black,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 20,
                                    vertical: 14,
                                  ),
                                  shape: RoundedRectangleBorder(
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  elevation: 4,
                                ),
                              ),
                            ],
                          ),

                          const SizedBox(height: 16),

                          // Genre Filter Pills
                          SingleChildScrollView(
                            scrollDirection: Axis.horizontal,
                            child: Row(
                              children: [
                                'All',
                                'Action',
                                'Sci-Fi',
                                'Fantasy',
                                'Supernatural',
                                'Urban Fantasy',
                              ].map((genre) {
                                final isSelected = selectedGenre == genre;
                                return Padding(
                                  padding: const EdgeInsets.only(right: 8),
                                  child: FilterChip(
                                    label: Text(genre),
                                    selected: isSelected,
                                    onSelected: (_) => onGenreSelected(genre),
                                    selectedColor: const Color(0xFFF59E0B),
                                    backgroundColor: const Color(0xFF131927),
                                    labelStyle: TextStyle(
                                      color: isSelected ? Colors.black : const Color(0xFF94A3B8),
                                      fontWeight: isSelected ? FontWeight.w900 : FontWeight.w600,
                                      fontSize: 12,
                                    ),
                                    shape: RoundedRectangleBorder(
                                      borderRadius: BorderRadius.circular(20),
                                      side: BorderSide(
                                        color: isSelected
                                            ? const Color(0xFFF59E0B)
                                            : const Color(0xFF1E293B),
                                      ),
                                    ),
                                  ),
                                );
                              }).toList(),
                            ),
                          ),

                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                'MANGA RELEASES (${mangaList.length})',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: 1.0,
                                ),
                              ),
                              const Text(
                                'DESKTOP 4-COLUMN GRID',
                                style: TextStyle(
                                  color: Color(0xFFF59E0B),
                                  fontSize: 11,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),

                  // Manga Grid with 4 columns per row
                  SliverPadding(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                    sliver: SliverGrid(
                      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 4, // 4 manga per row on Desktop
                        crossAxisSpacing: 16,
                        mainAxisSpacing: 20,
                        childAspectRatio: 0.65,
                      ),
                      delegate: SliverChildBuilderDelegate(
                        (context, index) {
                          final item = mangaList[index];
                          return _MangaCardWidget(manga: item);
                        },
                        childCount: mangaList.length,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),

          // -------------------------------------------------------------
          // RIGHT SIDE: Featured Manga Large Banner
          // -------------------------------------------------------------
          Container(
            width: 320,
            decoration: const BoxDecoration(
              color: Color(0xFF0F1420),
              border: Border(
                left: BorderSide(color: Color(0xFF1E293B), width: 1),
              ),
            ),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: const [
                      Icon(Icons.star_rounded, color: Color(0xFFF59E0B), size: 18),
                      SizedBox(width: 8),
                      Text(
                        'FEATURED SPOTLIGHT',
                        style: TextStyle(
                          color: Color(0xFFF59E0B),
                          fontWeight: FontWeight.w900,
                          fontSize: 11,
                          letterSpacing: 1.2,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Featured Manga Poster
                  ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Stack(
                      children: [
                        Image.network(
                          featuredManga.coverUrl,
                          height: 380,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            height: 380,
                            color: const Color(0xFF1E293B),
                            child: const Center(
                              child: Icon(Icons.broken_image, color: Colors.white30, size: 48),
                            ),
                          ),
                        ),
                        Positioned.fill(
                          child: Container(
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  const Color(0xFF0F1420).withOpacity(0.95),
                                ],
                                begin: Alignment.topCenter,
                                end: Alignment.bottomCenter,
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          top: 12,
                          left: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: const Color(0xFFF59E0B),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Text(
                              '#1 TRENDING',
                              style: TextStyle(
                                color: Colors.black,
                                fontSize: 10,
                                fontWeight: FontWeight.w900,
                              ),
                            ),
                          ),
                        ),
                        Positioned(
                          bottom: 16,
                          left: 16,
                          right: 16,
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                featuredManga.title,
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 20,
                                  fontWeight: FontWeight.w900,
                                  height: 1.2,
                                ),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'By ${featuredManga.author}',
                                style: const TextStyle(
                                  color: Color(0xFF94A3B8),
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 6),
                              Row(
                                children: [
                                  const Icon(Icons.star, color: Color(0xFFF59E0B), size: 14),
                                  const SizedBox(width: 4),
                                  Text(
                                    '${featuredManga.rating}',
                                    style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.bold,
                                      fontSize: 12,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Text(
                                    featuredManga.chapterCount,
                                    style: const TextStyle(
                                      color: Color(0xFF94A3B8),
                                      fontSize: 11,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 16),
                  const Text(
                    'SYNOPSIS',
                    style: TextStyle(
                      color: Color(0xFF64748B),
                      fontSize: 10,
                      fontWeight: FontWeight.w800,
                      letterSpacing: 1.0,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    featuredManga.synopsis,
                    style: const TextStyle(
                      color: Color(0xFFCBD5E1),
                      fontSize: 12,
                      height: 1.4,
                    ),
                  ),

                  const SizedBox(height: 20),

                  // "Read Now" CTA Button
                  SizedBox(
                    width: double.infinity,
                    height: 44,
                    child: ElevatedButton.icon(
                      onPressed: () {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text('Reading ${featuredManga.title} Chapter 1...'),
                            backgroundColor: const Color(0xFFF59E0B),
                          ),
                        );
                      },
                      icon: const Icon(Icons.play_arrow_rounded, color: Colors.black),
                      label: const Text(
                        'Read Chapter 1 Free',
                        style: TextStyle(
                          color: Colors.black,
                          fontWeight: FontWeight.w900,
                          fontSize: 13,
                        ),
                      ),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFF59E0B),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                        elevation: 4,
                      ),
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Secondary Action
                  SizedBox(
                    width: double.infinity,
                    height: 40,
                    child: OutlinedButton.icon(
                      onPressed: () {},
                      icon: const Icon(Icons.favorite_border_rounded, size: 16, color: Color(0xFFE2E8F0)),
                      label: const Text(
                        'Add to Favorites',
                        style: TextStyle(color: Color(0xFFE2E8F0), fontSize: 12),
                      ),
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: Color(0xFF334155)),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ============================================================================
// MOBILE HOME VIEW (Width <= 800px)
// Layout: [Search...] -> [Manga][Manga] (2 cols) -> [Bottom Tabs]
// ============================================================================

class MobileHome extends StatelessWidget {
  final List<MangaItem> mangaList;
  final MangaItem featuredManga;
  final String searchQuery;
  final String selectedGenre;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String> onGenreSelected;
  final int selectedNavIndex;
  final ValueChanged<int> onNavTap;

  const MobileHome({
    Key? key,
    required this.mangaList,
    required this.featuredManga,
    required this.searchQuery,
    required this.selectedGenre,
    required this.onSearchChanged,
    required this.onGenreSelected,
    required this.selectedNavIndex,
    required this.onNavTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0A0D14),
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F1420),
        elevation: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFFF59E0B), Color(0xFFDC2626)],
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(
                Icons.local_fire_department,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 8),
            const Text(
              'KA+ PULSE',
              style: TextStyle(
                color: Colors.white,
                fontWeight: FontWeight.w900,
                fontSize: 16,
                letterSpacing: 1.2,
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.cloud_upload_rounded, color: Color(0xFFF59E0B)),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Opening Upload Studio...')),
              );
            },
          ),
        ],
      ),
      body: CustomScrollView(
        slivers: [
          // Search input on mobile
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Container(
                height: 44,
                decoration: BoxDecoration(
                  color: const Color(0xFF131927),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF1E293B)),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 14),
                child: Row(
                  children: [
                    const Icon(Icons.search_rounded, color: Color(0xFF64748B), size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: TextField(
                        onChanged: onSearchChanged,
                        style: const TextStyle(color: Colors.white, fontSize: 13),
                        decoration: const InputDecoration(
                          hintText: 'Search manga...',
                          hintStyle: TextStyle(color: Color(0xFF64748B), fontSize: 12),
                          border: InputBorder.none,
                          isDense: true,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),

          // 2 Columns Manga Grid for Phone
          SliverPadding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            sliver: SliverGrid(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2, // 2 manga per row on Phone
                crossAxisSpacing: 12,
                mainAxisSpacing: 16,
                childAspectRatio: 0.65,
              ),
              delegate: SliverChildBuilderDelegate(
                (context, index) {
                  final item = mangaList[index];
                  return _MangaCardWidget(manga: item);
                },
                childCount: mangaList.length,
              ),
            ),
          ),

          const SliverToBoxAdapter(
            child: SizedBox(height: 24),
          ),
        ],
      ),

      // Bottom Tabs for Phone
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: Color(0xFF0F1420),
          border: Border(
            top: BorderSide(color: Color(0xFF1E293B), width: 1),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: selectedNavIndex,
          onTap: onNavTap,
          backgroundColor: Colors.transparent,
          elevation: 0,
          type: BottomNavigationBarType.fixed,
          selectedItemColor: const Color(0xFFF59E0B),
          unselectedItemColor: const Color(0xFF64748B),
          selectedLabelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 11),
          unselectedLabelStyle: const TextStyle(fontSize: 10),
          items: const [
            BottomNavigationBarItem(
              icon: Icon(Icons.auto_stories_rounded),
              label: 'Reader',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.create_rounded),
              label: 'Studio',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.account_balance_wallet_rounded),
              label: 'Wallet',
            ),
            BottomNavigationBarItem(
              icon: Icon(Icons.emoji_events_rounded),
              label: 'Awards',
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// HELPER WIDGETS (Sidebar items & Manga cards)
// ============================================================================

class _SidebarNavItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isSelected;
  final VoidCallback onTap;
  final String? badge;
  final Color? badgeColor;

  const _SidebarNavItem({
    Key? key,
    required this.icon,
    required this.label,
    required this.isSelected,
    required this.onTap,
    this.badge,
    this.badgeColor,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.only(bottom: 6),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
        decoration: BoxDecoration(
          color: isSelected ? const Color(0xFFF59E0B).withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          border: isSelected
              ? Border.all(color: const Color(0xFFF59E0B).withOpacity(0.4))
              : Border.all(color: Colors.transparent),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 20,
              color: isSelected ? const Color(0xFFF59E0B) : const Color(0xFF94A3B8),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                label,
                style: TextStyle(
                  color: isSelected ? Colors.white : const Color(0xFF94A3B8),
                  fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                  fontSize: 13,
                ),
              ),
            ),
            if (badge != null)
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                decoration: BoxDecoration(
                  color: (badgeColor ?? const Color(0xFFF59E0B)).withOpacity(0.2),
                  borderRadius: BorderRadius.circular(6),
                ),
                child: Text(
                  badge!,
                  style: TextStyle(
                    color: badgeColor ?? const Color(0xFFF59E0B),
                    fontSize: 9,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

class _MangaCardWidget extends StatelessWidget {
  final MangaItem manga;

  const _MangaCardWidget({Key? key, required this.manga}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: const Color(0xFF131927),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: const Color(0xFF1E293B)),
      ),
      clipBehavior: Clip.antiAlias,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Cover Image
          Expanded(
            child: Stack(
              fit: StackFit.expand,
              children: [
                Image.network(
                  manga.coverUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: const Color(0xFF1E293B),
                    child: const Center(
                      child: Icon(Icons.menu_book_rounded, color: Colors.white24, size: 32),
                    ),
                  ),
                ),
                if (manga.isVip)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF9333EA),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: const Text(
                        'VIP',
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 9,
                          fontWeight: FontWeight.w900,
                        ),
                      ),
                    ),
                  ),
                Positioned(
                  bottom: 8,
                  left: 8,
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.black87,
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.star, color: Color(0xFFF59E0B), size: 10),
                        const SizedBox(width: 3),
                        Text(
                          '${manga.rating}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Metadata Details
          Padding(
            padding: const EdgeInsets.all(10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  manga.title,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w800,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  manga.genre,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Color(0xFF64748B),
                    fontSize: 10,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
