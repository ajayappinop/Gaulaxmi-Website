import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  LayoutGrid, 
  List, 
  GitBranch, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Maximize2, 
  IdCard, 
  Phone, 
  Mail, 
  Calendar, 
  Wallet, 
  ShieldCheck, 
  User,
  Info,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown
} from 'lucide-react';

// Enhanced Mock Hierarchy data representing the chain from Founder
// down to the logged-in user, and down to their referrals (Multi-level layout)
interface NetworkNode {
  id: string;
  name: string;
  phone: string;
  email: string;
  level: number;
  role: string;
  joinDate: string;
  totalReferrals: number;
  status: 'active' | 'pending';
  totalInvested: string;
  monthlyPayout: string;
  isCurrentUser?: boolean;
  referredBy?: string;
  children: NetworkNode[];
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  label = 'items'
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
  label?: string;
}) {
  if (totalPages <= 1) return null;

  const getPageNumbers = () => {
    const pages = [];
    const maxVisibleDirs = 5;
    if (totalPages <= maxVisibleDirs) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const startIdx = (currentPage - 1) * itemsPerPage + 1;
  const endIdx = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-3 px-4 border border-stone-150 rounded-2xl bg-[#faf7f2]/40 font-sans text-xs">
      <div className="text-stone-500">
        Showing <span className="font-semibold text-stone-800">{startIdx}</span> to{' '}
        <span className="font-semibold text-stone-800">{endIdx}</span> of{' '}
        <span className="font-semibold text-stone-800">{totalItems}</span> {label}
      </div>
      <div className="flex items-center gap-1.5 self-end sm:self-auto">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-1 px-2.5 rounded-lg border border-stone-200 bg-white hover:bg-[#faf7f2] disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 text-stone-600 font-semibold cursor-pointer flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Prev
        </button>
        {getPageNumbers().map((p, idx) => (
          <button
            key={idx}
            onClick={() => typeof p === 'number' && onPageChange(p)}
            disabled={p === '...'}
            className={`w-7 h-7 rounded-lg font-semibold flex items-center justify-center transition-all ${
              p === currentPage
                ? 'bg-[#83532c] text-white'
                : p === '...'
                ? 'text-stone-400 bg-transparent cursor-default'
                : 'border border-stone-200 bg-white hover:bg-[#faf7f2] text-stone-600 cursor-pointer'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-1 px-2.5 rounded-lg border border-stone-200 bg-white hover:bg-[#faf7f2] disabled:opacity-40 disabled:cursor-not-allowed transition duration-150 text-stone-600 font-semibold cursor-pointer flex items-center gap-1"
        >
          Next <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

const mockNetworkData: NetworkNode = {
  id: "GLX-0001",
  name: "Gaurav Vyas (Founder)",
  phone: "+91 94140 12345",
  email: "founder@gaulaxmi.com",
  level: 1,
  role: "Global Admin & Founder",
  joinDate: "05 Jan 2024",
  totalReferrals: 12,
  status: "active",
  totalInvested: "₹50,00,000",
  monthlyPayout: "Gaulaxmi Estate Base",
  children: [
    {
      id: "GLX-0054",
      name: "Rajesh Kumar (Partner)",
      phone: "+91 98120 44556",
      email: "rajesh.partner@gaulaxmi.com",
      level: 2,
      role: "Strategic Master Partner",
      joinDate: "12 Feb 2024",
      totalReferrals: 5,
      status: "active",
      totalInvested: "₹15,00,000",
      monthlyPayout: "₹75,000 / mo",
      referredBy: "Gaurav Vyas",
      children: [
        {
          id: "GLX-0129",
          name: "Amrita Patel (Referrer)",
          phone: "+91 81290 88223",
          email: "amrita.patel@gmail.com",
          level: 3,
          role: "District Representative",
          joinDate: "20 Mar 2024",
          totalReferrals: 3,
          status: "active",
          totalInvested: "₹5,00,000",
          monthlyPayout: "₹25,000 / mo",
          referredBy: "Rajesh Kumar",
          children: [
            {
              id: "GLX-1042",
              name: "John Doe (You)",
              phone: "+91 90000 12345",
              email: "john.doe@example.com",
              level: 4,
              role: "Verified Cow Investor",
              joinDate: "01 May 2024",
              totalReferrals: 2,
              status: "active",
              totalInvested: "₹3,00,000",
              monthlyPayout: "₹15,000 / mo",
              isCurrentUser: true,
              referredBy: "Amrita Patel",
              children: [
                {
                  id: "GLX-2089",
                  name: "Sarah Smith",
                  phone: "+91 88888 11111",
                  email: "sarah.smith@example.com",
                  level: 5,
                  role: "Cow-Tier I Investor",
                  joinDate: "10 Jun 2024",
                  totalReferrals: 2,
                  status: "active",
                  totalInvested: "₹1,50,000",
                  monthlyPayout: "₹7,500 / mo",
                  referredBy: "John Doe (You)",
                  children: [
                    {
                      id: "GLX-4011",
                      name: "Mike Brown",
                      phone: "+91 77777 22222",
                      email: "mike.brown@outlook.com",
                      level: 6,
                      role: "Micro Investor",
                      joinDate: "15 Jul 2024",
                      totalReferrals: 0,
                      status: "active",
                      totalInvested: "₹50,000",
                      monthlyPayout: "₹2,500 / mo",
                      referredBy: "Sarah Smith",
                      children: []
                    },
                    {
                      id: "GLX-4012",
                      name: "Emily Davis",
                      phone: "+91 77777 33333",
                      email: "emily.davis@gmail.com",
                      level: 6,
                      role: "Interested Lead",
                      joinDate: "28 Jul 2024",
                      totalReferrals: 0,
                      status: "pending",
                      totalInvested: "₹0",
                      monthlyPayout: "₹0 / mo",
                      referredBy: "Sarah Smith",
                      children: []
                    }
                  ]
                },
                {
                  id: "GLX-2090",
                  name: "David Wilson",
                  phone: "+91 88888 22222",
                  email: "david.w@example.com",
                  level: 5,
                  role: "Cow-Tier I Investor",
                  joinDate: "18 Jun 2024",
                  totalReferrals: 1,
                  status: "active",
                  totalInvested: "₹1,50,000",
                  monthlyPayout: "₹7,500 / mo",
                  referredBy: "John Doe (You)",
                  children: [
                    {
                      id: "GLX-4025",
                      name: "Jessica Taylor",
                      phone: "+91 77777 44444",
                      email: "jessica.t@example.com",
                      level: 6,
                      role: "Micro Investor",
                      joinDate: "05 Aug 2024",
                      totalReferrals: 0,
                      status: "active",
                      totalInvested: "₹50,000",
                      monthlyPayout: "₹2,500 / mo",
                      referredBy: "David Wilson",
                      children: []
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export function HierarchyTab() {
  const [view, setView] = useState<'flow' | 'grid' | 'list'>('flow');
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(mockNetworkData.children[0].children[0].children[0]); // Default to "John Doe (You)"
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Always use the direct referrer (Amrita Patel) as root, showing the user (John Doe) and user's children
  const activeRoot = useMemo(() => {
    const rajeshNode = mockNetworkData.children[0];
    const amritaNode = rajeshNode.children[0];
    return amritaNode;
  }, []);

  const currentUserNode = useMemo(() => {
    // Current user in this structure is RajesH -> Amrita -> John
    return mockNetworkData.children[0].children[0].children[0];
  }, []);

  // Flatten active root nodes to list all members for quick querying
  const allNodes = useMemo(() => {
    const list: NetworkNode[] = [];
    const traverse = (node: NetworkNode) => {
      list.push(node);
      if (node.children) {
        node.children.forEach(traverse);
      }
    };
    traverse(activeRoot);
    return list;
  }, [activeRoot]);

  // Handle local searching by member names or unique ID
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return allNodes;
    const query = searchQuery.toLowerCase();
    return allNodes.filter(
      node => node.name.toLowerCase().includes(query) || node.id.toLowerCase().includes(query)
    );
  }, [allNodes, searchQuery]);

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-2xl text-bark flex items-center gap-2">
            <GitBranch className="w-6 h-6 text-primary" />
            MLM Referral Network Tree
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Track user relationships from the Gaulaxmi Founder down to the deepest nodes.
          </p>
        </div>
      </div>

      {/* Search Bar Block with Matching Stats */}
      <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 w-4.5 h-4.5" />
            <input
              type="text"
              placeholder="Search network..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 transition"
                title="Clear Search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggles */}
            <div className="flex bg-white rounded-xl border border-stone-200 p-1 shadow-sm">
              <button
                onClick={() => setView('flow')}
                className={`p-2 rounded-lg transition-colors ${view === 'flow' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-stone-50'}`}
                title="Interactive Flow Chart"
              >
                <GitBranch className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('grid')}
                className={`p-2 rounded-lg transition-colors ${view === 'grid' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-stone-50'}`}
                title="Dashboard Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg transition-colors ${view === 'list' ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-stone-50'}`}
                title="Indented List View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 text-xs w-full lg:w-auto">
          {searchQuery && (
            <span className="text-muted-foreground font-medium bg-stone-100 px-3 py-1.5 rounded-xl border border-stone-200/60">
              Found <strong className="text-stone-800">{filteredNodes.length}</strong> matching members
            </span>
          )}
          {searchQuery && filteredNodes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 items-center justify-end">
              <span className="text-stone-400 ml-1">Focus match:</span>
              {filteredNodes.slice(0, 3).map(node => (
                <button
                  key={node.id}
                  onClick={() => {
                    setSelectedNode(node);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    selectedNode?.id === node.id
                    ? 'bg-[#7f4e1c] text-white border-[#7f4e1c]'
                    : 'bg-white text-stone-700 hover:bg-stone-50 border-stone-200'
                  }`}
                >
                  {node.name.split(' ')[0]} ({node.id})
                </button>
              ))}
              {filteredNodes.length > 3 && (
                <span className="text-stone-400 text-[10px] font-mono">+{filteredNodes.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main View Area */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        {/* Network Area */}
        <div className="xl:col-span-3 bg-white border border-stone-200 rounded-3xl overflow-hidden shadow-sm h-[600px] relative flex flex-col hierarchy-tree-nodes-container">
          {view === 'flow' ? (
            <FlowTreeView rootNode={activeRoot} onSelectNode={setSelectedNode} selectedNode={selectedNode} searchQuery={searchQuery} />
          ) : view === 'grid' ? (
            <div className="p-6 overflow-y-auto h-full space-y-6">
              <div className="bg-amber-50/50 border border-amber-200/50 rounded-2xl p-4 flex items-start gap-3">
                <Info className="w-5 h-5 text-[#7f4e1c] mt-0.5 shrink-0" />
                <p className="text-xs text-[#7f4e1c] leading-relaxed">
                  <strong>Referral Matrix:</strong> This view lists your direct referred network cards recursively grouped by depth. Click on any member to inspect their complete stats in the detail panel.
                </p>
              </div>
              <NetworkGrid rootNode={currentUserNode} excludeRoot={true} onSelect={setSelectedNode} searchQuery={searchQuery} />
            </div>
          ) : (
            <div className="p-6 overflow-y-auto h-full">
              <NetworkList rootNode={currentUserNode} excludeRoot={true} onSelect={setSelectedNode} searchQuery={searchQuery} />
            </div>
          )}
        </div>

        {/* Member Details Inspector Panel */}
        <div className="xl:col-span-1 bg-white border border-stone-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="border-b border-stone-100 pb-4">
            <h3 className="font-display font-bold text-lg text-bark">Member Details</h3>
            <p className="text-xs text-muted-foreground mt-1">Real-time MLM credentials and node overview</p>
          </div>

          {selectedNode ? (
            <AnimatePresence mode="wait">
              <motion.div 
                key={selectedNode.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4 text-stone-800"
              >
                {/* Visual Header */}
                <div className="flex items-center gap-3">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center border-2 text-xl font-bold shadow-sm ${
                    selectedNode.isCurrentUser 
                    ? 'bg-primary/10 border-primary text-primary' 
                    : selectedNode.status === 'active' 
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700' 
                    : 'bg-amber-50 border-amber-400 text-amber-700'
                  }`}>
                    {selectedNode.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-bark flex items-center gap-1.5">
                      {selectedNode.name}
                      {selectedNode.isCurrentUser && (
                        <span className="bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold scale-95">You</span>
                      )}
                    </div>
                    {selectedNode.id !== activeRoot.id && (
                      <div className="text-xs text-muted-foreground">{selectedNode.role}</div>
                    )}
                  </div>
                </div>

                {selectedNode.id !== activeRoot.id && (
                  <>
                    <hr className="border-stone-100" />

                    {/* Info Fields */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2.5">
                        <IdCard className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="text-muted-foreground w-20 shrink-0">Member ID:</span>
                        <span className="font-mono font-medium">{selectedNode.id}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <GitBranch className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="text-muted-foreground w-20 shrink-0">Tree Level:</span>
                        <span className="font-bold text-stone-700">Level {selectedNode.level}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Phone className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="text-muted-foreground w-20 shrink-0">Phone:</span>
                        <span className="font-medium">{selectedNode.phone}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="text-muted-foreground w-20 shrink-0">Email:</span>
                        <span className="truncate font-medium">{selectedNode.email}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                        <span className="text-muted-foreground w-20 shrink-0">Joined On:</span>
                        <span className="font-medium text-stone-600">{selectedNode.joinDate}</span>
                      </div>

                      {selectedNode.referredBy && (
                        <div className="flex items-center gap-2.5">
                          <User className="w-4 h-4 text-stone-400 shrink-0" />
                          <span className="text-muted-foreground w-20 shrink-0">Referred By:</span>
                          <span className="font-medium text-stone-700">{selectedNode.referredBy}</span>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {selectedNode.id !== activeRoot.id && (
                  <>
                    <hr className="border-stone-100" />

                    {/* Investment Stats */}
                    <div className="bg-[#fcfaf7] border border-stone-200/60 rounded-2xl p-4 space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-muted-foreground flex items-center gap-1.5">
                          <Wallet className="w-3.5 h-3.5 text-stone-500" /> Cow Investment
                        </span>
                        <span className={`px-2 py-0.5 rounded-full font-bold uppercase text-[9px] tracking-wide ${
                          selectedNode.status === 'active' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-amber-100 text-amber-800'
                        }`}>{selectedNode.status}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Total Invested</span>
                          <p className="text-base font-bold text-stone-800 font-display mt-0.5">{selectedNode.totalInvested}</p>
                        </div>
                        <div>
                          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Assoc. Yield</span>
                          <p className="text-base font-bold text-primary font-display mt-0.5">{selectedNode.monthlyPayout}</p>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-stone-200/50 flex justify-between items-center text-xs">
                        <span className="text-muted-foreground">Direct Referrals:</span>
                        <span className="font-semibold text-stone-800 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-stone-500" /> {selectedNode.totalReferrals} members
                        </span>
                      </div>
                    </div>

                    {selectedNode.status === 'pending' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-[#7f4e1c]">
                        This account is in pending state. Direct monthly ROI will begin to yield as soon as their initial Cow Backed wealth slot is activated.
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          ) : (
            <div className="text-center py-12 text-muted-foreground text-sm">
              <Users className="w-10 h-10 mx-auto text-stone-300 mb-2" />
              Hover or click on any profile card on the left to inspect node genealogy and active financial stats.
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ------------------------------------------------------------
// INTERACTIVE FLOW TREE VIEW (REPLICATES UPLOADED IMAGE AESTHETIC)
// ------------------------------------------------------------
interface Point {
  x: number;
  y: number;
}

interface RenderNode {
  id: string;
  name: string;
  level: number;
  status: 'active' | 'pending';
  node: NetworkNode;
  x: number;
  y: number;
  childrenIds: string[];
}

function FlowTreeView({ 
  rootNode, 
  onSelectNode, 
  selectedNode,
  searchQuery = ''
}: { 
  rootNode: NetworkNode; 
  onSelectNode: (node: NetworkNode) => void; 
  selectedNode: NetworkNode | null;
  searchQuery?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Interactive navigation states (Pan and Zoom)
  const [scale, setScale] = useState<number>(0.9);
  const [translate, setTranslate] = useState<{ x: number; y: number }>({ x: 0, y: 30 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showReferralBadges, setShowReferralBadges] = useState<boolean>(true);

  // Set of collapsed node IDs representing nodes that hide their babies
  const [collapsedNodeIds, setCollapsedNodeIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = -e.deltaY * 0.001;
      setScale(prev => Math.min(Math.max(prev + zoomFactor, 0.4), 2.0));
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Toggle single node expand/collapse
  const toggleNodeCollapse = (id: string) => {
    setCollapsedNodeIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Toggle all expand/collapse
  const toggleAll = () => {
    if (collapsedNodeIds.size > 0) {
      setCollapsedNodeIds(new Set());
      toast.success("All hierarchy levels expanded!");
    } else {
      // Find all non-leaf nodes recursively
      const nonLeafs = new Set<string>();
      const traverse = (node: NetworkNode) => {
        if (node.children && node.children.length > 0) {
          nonLeafs.add(node.id);
          node.children.forEach(traverse);
        }
      };
      traverse(rootNode);
      setCollapsedNodeIds(nonLeafs);
      toast.success("All hierarchy levels collapsed!");
    }
  };

  // Calculate layout coordinates recursively (Orthogonal tree structure)
  const { renderedNodes, renderedLines } = useMemo(() => {
    const nodesList: RenderNode[] = [];
    const linesList: { from: Point; to: Point }[] = [];
    const levelHeight = 150; // Vertical distance between tree levels

    const countLeaves = (node: NetworkNode): number => {
      if (collapsedNodeIds.has(node.id) || !node.children || node.children.length === 0) return 1;
      return node.children.reduce((sum, child) => sum + countLeaves(child), 0);
    };

    const runLayout = (
      node: NetworkNode, 
      xStart: number, 
      xEnd: number, 
      currentY: number,
      parentPoint?: Point
    ) => {
      const currentX = (xStart + xEnd) / 2;
      
      const rNode: RenderNode = {
        id: node.id,
        name: node.name,
        level: node.level,
        status: node.status,
        node: node,
        x: currentX,
        y: currentY,
        childrenIds: node.children.map(c => c.id)
      };
      nodesList.push(rNode);

      if (parentPoint) {
        const midY = (parentPoint.y + currentY) / 2;
        linesList.push({ 
          from: parentPoint, 
          to: { x: parentPoint.x, y: midY } 
        });
        linesList.push({ 
          from: { x: parentPoint.x, y: midY }, 
          to: { x: currentX, y: midY } 
        });
        linesList.push({ 
          from: { x: currentX, y: midY }, 
          to: { x: currentX, y: currentY } 
        });
      }

      if (node.children && node.children.length > 0 && !collapsedNodeIds.has(node.id)) {
        const totalLeaves = node.children.reduce((acc, child) => acc + countLeaves(child), 0);
        let segmentStart = xStart;
        const totalWidth = xEnd - xStart;

        node.children.forEach((child) => {
          const childLeaves = countLeaves(child);
          const childRatio = childLeaves / totalLeaves;
          const segmentEnd = segmentStart + (totalWidth * childRatio);
          
          runLayout(
            child, 
            segmentStart, 
            segmentEnd, 
            currentY + levelHeight, 
            { x: currentX, y: currentY }
          );
          
          segmentStart = segmentEnd;
        });
      }
    };

    runLayout(rootNode, 50, 1150, 80);

    return { renderedNodes: nodesList, renderedLines: linesList };
  }, [rootNode, collapsedNodeIds]);

  // Adjust zoom controls
  const zoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.4));
  const resetZoom = () => {
    setScale(0.9);
    setTranslate({ x: 0, y: 30 });
  };

  // Mouse drag handlers to pan the viewport smoothly
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - translate.x, y: e.clientY - translate.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  const handleNodeHover = (node: NetworkNode, e: React.MouseEvent) => {
    setHoveredNode(node);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setHoverPosition({
        x: e.clientX - rect.left + 15,
        y: e.clientY - rect.top + 15
      });
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative w-full h-full overflow-hidden select-none bg-stone-50/70 ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
    >
      {/* Zoom control HUD */}
      <div className="absolute bottom-5 left-5 z-20 flex flex-wrap items-center bg-white border border-stone-200/80 rounded-xl p-1.5 shadow-md gap-1">
        <button 
          onClick={zoomIn} 
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button 
          onClick={zoomOut} 
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="h-4 w-[1px] bg-stone-200 mx-1" />
        <button 
          onClick={resetZoom} 
          className="p-2 rounded-lg hover:bg-stone-100 text-stone-600 hover:text-stone-900 transition-colors flex items-center gap-1.5 text-xs font-semibold"
          title="Reset Canvas View"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
        <div className="h-4 w-[1px] bg-stone-200 mx-1" />
        <button 
          onClick={toggleAll}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            collapsedNodeIds.size > 0 
            ? 'bg-amber-100/80 text-[#7f4e1c] hover:bg-amber-150 border border-amber-200' 
            : 'hover:bg-stone-100 text-[#7f4e1c] hover:text-[#5e3813]'
          }`}
          title="Collapse or expand all levels at once"
        >
          <GitBranch className="w-3.5 h-3.5" /> 
          {collapsedNodeIds.size > 0 ? 'Expand All' : 'Collapse All'}
        </button>
        <div className="h-4 w-[1px] bg-stone-200 mx-1" />
        <button 
          onClick={() => setShowReferralBadges(!showReferralBadges)} 
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
            showReferralBadges 
            ? 'bg-[#7f4e1c] text-white' 
            : 'hover:bg-stone-100 text-stone-600 hover:text-stone-900'
          }`}
          title="Toggle Direct Referrals Badges"
        >
          <Users className="w-3.5 h-3.5" /> 
          Referrals: {showReferralBadges ? 'ON' : 'OFF'}
        </button>
      </div>

      <div className="absolute top-5 left-5 z-20 bg-stone-900/5 text-stone-800 text-[10px] px-3 py-1.5 rounded-full font-medium border border-stone-900/10 backdrop-blur-md font-sans">
        💡 Drag the canvas to pan · Use controls to Zoom
      </div>

      {/* Floating Toggle All Button on the right of the container */}
      <div className="absolute top-5 right-5 z-20">
        <button
          onClick={toggleAll}
          className="px-3.5 py-1.5 bg-white hover:bg-stone-50 border border-stone-200 hover:border-stone-400 text-[#7f4e1c] hover:text-[#5e3813] rounded-xl text-xs font-bold shadow-md flex items-center gap-1.5 transition cursor-pointer"
          title="Collapse or expand all hierarchy levels at once"
        >
          <GitBranch className="w-3.5 h-3.5 text-[#7f4e1c]" />
          Toggle All ({collapsedNodeIds.size > 0 ? 'Expand All' : 'Collapse All'})
        </button>
      </div>

      {/* Canvas viewport space */}
      <div 
        style={{
          transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
          transformOrigin: '50% 10%',
          transition: isDragging ? 'none' : 'transform 0.15s ease-out',
        }}
        className="w-[1200px] h-[750px] relative transition-transform duration-100"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
          {/* Connector lines matching user image */}
          {renderedLines.map((line, idx) => (
            <line
              key={idx}
              x1={line.from.x}
              y1={line.from.y}
              x2={line.to.x}
              y2={line.to.y}
              className="stroke-stone-300 stroke-2"
              strokeLinecap="round"
            />
          ))}
        </svg>

        {/* Tree Nodes overlayed */}
        {renderedNodes.map((rn) => {
          const isSelected = selectedNode?.id === rn.id;
          const query = searchQuery.trim().toLowerCase();
          const isMatched = query ? (rn.name.toLowerCase().includes(query) || rn.id.toLowerCase().includes(query)) : false;
          const hasActiveSearch = !!query;

          return (
            <div
              key={rn.id}
              style={{
                position: 'absolute',
                left: rn.x - 28, // Centered around coordinate
                top: rn.y - 28,
              }}
              className={`z-10 cursor-pointer transition-all duration-300 group ${
                hasActiveSearch && !isMatched ? 'opacity-20 hover:opacity-80 scale-90' : 'opacity-100'
              }`}
              onClick={() => onSelectNode(rn.node)}
              onMouseEnter={(e) => handleNodeHover(rn.node, e)}
              onMouseMove={(e) => handleNodeHover(rn.node, e)}
              onMouseLeave={() => setHoveredNode(null)}
            >
              {/* MLM Profile Node Frame */}
              <div 
                className={`w-14 h-14 rounded-full border-2 bg-white flex items-center justify-center relative transition-all shadow-md hover:scale-110 hover:shadow-lg ${
                  isMatched
                  ? 'border-[#7f4e1c] ring-4 ring-[#7f4e1c]/40 scale-105'
                  : isSelected 
                  ? 'border-[#7f4e1c] ring-4 ring-[#7f4e1c]/10' 
                  : rn.status === 'active' 
                  ? 'border-emerald-500' 
                  : 'border-yellow-400'
                }`}
              >
                {/* Referrals Badge, indicating direct referral count */}
                {rn.node.totalReferrals > 0 && (
                  <div 
                    className={`absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full px-1 border flex items-center justify-center text-[9px] font-black shadow-sm transition-all duration-200 transform z-20 ${
                      showReferralBadges 
                      ? 'scale-100 opacity-100 hover:scale-125' 
                      : 'scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 hover:scale-125'
                    } ${
                      rn.node.isCurrentUser 
                      ? 'bg-amber-800 text-amber-50 border-white' 
                      : rn.status === 'active' 
                      ? 'bg-emerald-600 text-white border-white' 
                      : 'bg-yellow-500 text-stone-950 border-white'
                    }`}
                    title={`${rn.node.totalReferrals} direct referrals`}
                  >
                    {rn.node.totalReferrals}
                  </div>
                )}
                {/* Breathing glow effect for matched nodes */}
                {isMatched && (
                  <span className="absolute -inset-1.5 rounded-full border-2 border-[#7f4e1c] animate-ping opacity-60 pointer-events-none" />
                )}

                {/* Person Silhouette exactly as requested visually */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isMatched 
                  ? 'bg-amber-100 text-[#7f4e1c]'
                  : rn.node.isCurrentUser 
                  ? 'bg-primary/20 text-[#7f4e1c]' 
                  : rn.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-700' 
                  : 'bg-yellow-50 text-yellow-600'
                }`}>
                  <svg 
                    viewBox="0 0 24 24" 
                    fill="currentColor" 
                    className="w-7 h-7"
                  >
                    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z" clipRule="evenodd" />
                  </svg>
                </div>

                {/* Node Level Label attached directly beneath the node */}
                <div className={`absolute -bottom-2 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider shadow-sm border ${
                  isMatched
                  ? 'bg-[#7f4e1c] text-white border-[#7f4e1c]'
                  : rn.node.isCurrentUser 
                  ? 'bg-primary text-primary-foreground border-primary/20' 
                  : rn.status === 'active' 
                  ? 'bg-emerald-600 text-white border-emerald-700' 
                  : 'bg-yellow-500 text-stone-900 border-yellow-600'
                }`}>
                  {rn.node.isCurrentUser ? 'YOU' : `L${rn.level}`}
                </div>

                {/* Individual node toggle handle */}
                {rn.node.children && rn.node.children.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleNodeCollapse(rn.id);
                    }}
                    className={`absolute -bottom-6 left-1/2 -translate-x-1/2 w-4.5 h-4.5 rounded-full border shadow-md flex items-center justify-center font-extrabold text-[11px] transition-all duration-200 z-30 cursor-pointer ${
                      collapsedNodeIds.has(rn.id)
                      ? 'bg-amber-100 hover:bg-amber-200 border-amber-300 text-[#7f4e1c] scale-110 hover:scale-120'
                      : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-600 hover:text-stone-800 scale-100 hover:scale-110'
                    }`}
                    title={collapsedNodeIds.has(rn.id) ? "Expand children levels" : "Collapse children levels"}
                  >
                    {collapsedNodeIds.has(rn.id) ? '+' : '−'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Rich Tooltip containing Name, ID, Mobile Number and detailed stats */}
      <AnimatePresence>
        {hoveredNode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.1 }}
            style={{
              position: 'absolute',
              left: hoverPosition.x,
              top: hoverPosition.y,
            }}
            className="z-50 w-72 bg-[#1c120c]/95 text-[#fcfaf7] border border-gold/10 p-4 rounded-2xl shadow-xl pointer-events-none space-y-3 backdrop-blur-md font-sans"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gold uppercase tracking-widest font-bold">Gaulaxmi Network Node</span>
                <span className={`text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-md font-extrabold ${hoveredNode.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-400/10 text-amber-300 border border-amber-400/20'}`}>
                  {hoveredNode.status}
                </span>
              </div>
              <h4 className="font-bold text-sm text-white mt-1 leading-tight">{hoveredNode.name}</h4>
              {hoveredNode.id !== rootNode.id && (
                <p className="text-[10px] text-cream/70">{hoveredNode.role}</p>
              )}
            </div>

            {hoveredNode.id !== rootNode.id && (
              <div className="grid grid-cols-2 gap-2 text-[10px] border-t border-cream/10 pt-2 text-cream/90 font-medium">
                <div>
                  <span className="text-cream/55 block">MEMBER ID</span>
                  <span className="font-mono">{hoveredNode.id}</span>
                </div>
                <div>
                  <span className="text-cream/55 block">TREE LEVEL</span>
                  <span>Level {hoveredNode.level}</span>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-cream/55 block">MOBILE NUMBER</span>
                  <span>{hoveredNode.phone}</span>
                </div>
                <div className="col-span-2 pt-1">
                  <span className="text-cream/55 block">EMAIL ADDRESS</span>
                  <span className="truncate block">{hoveredNode.email}</span>
                </div>
              </div>
            )}

            {hoveredNode.id !== rootNode.id && (
              <div className="bg-cream/10 rounded-xl p-2.5 text-[10px] flex items-center justify-between">
                <div>
                  <span className="text-cream/60 uppercase text-[8px] tracking-wider block font-bold">Invested In Cows</span>
                  <span className="text-gold font-bold">{hoveredNode.totalInvested}</span>
                </div>
                <div>
                  <span className="text-cream/60 uppercase text-[8px] tracking-wider block font-bold">Monthly Yield</span>
                  <span className="text-white font-bold">{hoveredNode.monthlyPayout}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ------------------------------------------------------------
// LIST VIEWS AND GRID VIEWS INDENTED RECURSIVELY
// ------------------------------------------------------------
function NetworkGrid({ 
  rootNode, 
  onSelect,
  searchQuery = '',
  excludeRoot = false
}: { 
  rootNode: NetworkNode; 
  onSelect: (node: NetworkNode) => void;
  searchQuery?: string;
  excludeRoot?: boolean;
}) {
  // Convert full hierarchy object into horizontal grid layout levels
  const flattenNodes = (node: NetworkNode, result: NetworkNode[] = []): NetworkNode[] => {
    // Only push if not root, or if root exclusion is not desired
    if (!excludeRoot || node.id !== rootNode.id) {
      result.push(node);
    }
    
    if (node.children) {
      node.children.forEach(child => flattenNodes(child, result));
    }
    return result;
  };

  const nodes = useMemo(() => {
    const list = flattenNodes(rootNode);
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter(node => node.name.toLowerCase().includes(query) || node.id.toLowerCase().includes(query));
  }, [rootNode, searchQuery]);

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500 border border-stone-200 border-dashed rounded-2xl bg-[#fcfaf7] font-sans">
        <Users className="w-8 h-8 mx-auto text-stone-300 mb-2 animate-pulse" />
        No members found matching "{searchQuery}"
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 font-sans">
      {nodes.map((node) => {
      const query = searchQuery.trim().toLowerCase();
      const isMatched = query ? (node.name.toLowerCase().includes(query) || node.id.toLowerCase().includes(query)) : false;

      return (
        <div 
          key={node.id} 
          onClick={() => onSelect(node)}
          className={`border rounded-2xl p-4 cursor-pointer transition-all duration-200 group relative overflow-hidden ${
            isMatched 
            ? 'border-[#7f4e1c] bg-amber-50/30 hover:bg-amber-50 ring-2 ring-[#7f4e1c]/10' 
            : 'border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50'
          }`}
        >
          {node.isCurrentUser && (
            <div className="absolute top-0 right-0 bg-[#7f4e1c] text-white text-[8px] px-2.5 py-0.5 rounded-bl-xl font-bold uppercase tracking-wider">YOU</div>
          )}
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              isMatched
              ? 'bg-amber-100 text-[#7f4e1c]'
              : node.isCurrentUser 
              ? 'bg-primary/20 text-[#7f4e1c]' 
              : node.status === 'active' 
              ? 'bg-emerald-50 text-emerald-700' 
              : 'bg-amber-50 text-amber-700'
            }`}>
              {node.name.charAt(0)}
            </div>
            <div>
              <h4 className="font-bold text-sm text-bark mb-0.5 group-hover:text-stone-900">{node.name}</h4>
              {node.id !== rootNode.id && (
                <div className="text-[10px] text-muted-foreground font-mono">{node.id} · Level {node.level}</div>
              )}
            </div>
          </div>

          {node.id !== rootNode.id && (
            <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-stone-200/50 text-[11px]">
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase">Plan status</span>
                <span className={`font-semibold capitalize ${node.status === 'active' ? 'text-emerald-700' : 'text-amber-700'}`}>{node.status}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[9px] uppercase">Cow Slots</span>
                <span className="font-semibold text-stone-700">{node.totalInvested}</span>
              </div>
            </div>
          )}
        </div>
      );
      })}
    </div>
  );
}

function NetworkList({ 
  rootNode, 
  onSelect,
  searchQuery = '',
  excludeRoot = false
}: { 
  rootNode: NetworkNode; 
  onSelect: (node: NetworkNode) => void;
  searchQuery?: string;
  excludeRoot?: boolean;
}) {
  const query = searchQuery.trim().toLowerCase();
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());

  const toggleCollapse = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCollapsedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Helper to check if node or any of its children matches the filter
  const matchesOrHasMatchingDescendant = (node: NetworkNode): boolean => {
    if (!query) return true;
    if (node.name.toLowerCase().includes(query) || node.id.toLowerCase().includes(query)) return true;
    if (node.children) {
      return node.children.some(child => matchesOrHasMatchingDescendant(child));
    }
    return false;
  };

  // Convert full hierarchy object into flat level list with parent-child linkages
  const flattenNodes = (node: NetworkNode, depth = 0, result: { node: NetworkNode; depth: number }[] = []): { node: NetworkNode; depth: number }[] => {
    // If the query is present, check if this node matches or has a matching descendant
    if (query && !matchesOrHasMatchingDescendant(node)) {
      return result;
    }
    
    // Only push if not root, or if root exclusion is not desired
    if (!excludeRoot || node.id !== rootNode.id) {
      result.push({ node, depth });
    }
    
    if (node.children && node.children.length > 0 && !collapsedIds.has(node.id)) {
      node.children.forEach(child => flattenNodes(child, depth + 1, result));
    }
    return result;
  };

  const flattenedList = useMemo(() => {
    return flattenNodes(rootNode, 0);
  }, [rootNode, query, collapsedIds]);

  if (flattenedList.length === 0) {
    return (
      <div className="text-center py-12 text-stone-500 border border-stone-200 border-dashed rounded-2xl bg-[#fcfaf7] font-sans mt-4">
        <Users className="w-8 h-8 mx-auto text-stone-300 mb-2 animate-pulse" />
        No members found matching "{searchQuery}"
      </div>
    );
  }

  return (
    <div className="bg-white border border-stone-200/80 rounded-3xl shadow-sm overflow-hidden font-sans flex flex-col h-full">
      {/* Table Header */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-6 py-4 bg-stone-50 border-b border-stone-200 text-[10px] font-bold text-stone-500 uppercase tracking-widest sticky top-0 z-20">
        <div className="col-span-8 md:col-span-6 pl-2 flex items-center gap-2">
          <Users className="w-4 h-4 text-stone-400" /> Network Member
        </div>
        <div className="col-span-4 md:col-span-2 flex items-center">Level</div>
        <div className="md:col-span-2 hidden md:flex items-center justify-end">Investment</div>
        <div className="col-span-4 md:col-span-2 flex items-center justify-end">Status</div>
      </div>
      
      {/* Table Body */}
      <div className="overflow-y-auto divide-y divide-stone-100/60 pb-2">
        {flattenedList.map(({ node, depth }) => {
          const isMatched = query ? (node.name.toLowerCase().includes(query) || node.id.toLowerCase().includes(query)) : false;
          const hasChildren = node.children && node.children.length > 0;
          const isCollapsed = collapsedIds.has(node.id);

          return (
            <div 
              key={node.id}
              onClick={() => onSelect(node)}
              className={`grid grid-cols-1 lg:grid-cols-12 gap-4 px-6 py-3.5 items-center transition-all duration-200 cursor-pointer hover:bg-stone-50/80 ${
                isMatched ? 'bg-amber-50/30 relative' : ''
              }`}
            >
              {isMatched && <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#7f4e1c]"></div>}
              
              {/* Member Col */}
              <div 
                className="lg:col-span-6 flex items-center gap-3 relative" 
                style={{ paddingLeft: `${depth * 28}px` }}
              >
                {/* Visual Branch Line for Depth */}
                {depth > 0 && (
                  <div 
                    className="absolute border-l-2 border-stone-200 border-b-2 rounded-bl-xl pointer-events-none" 
                    style={{ 
                      left: `${(depth - 1) * 28 + 11}px`, 
                      top: '-20px', 
                      bottom: '50%', 
                      width: '20px' 
                    }}
                  />
                )}

                {/* Collage button / avatar spacer */}
                <div className="flex items-center justify-center w-6 h-6 shrink-0 z-10 relative">
                  {hasChildren ? (
                    <button 
                      onClick={(e) => toggleCollapse(e, node.id)}
                      className={`w-6 h-6 flex items-center justify-center rounded-full transition-all duration-200 pointer-events-auto border shadow-sm ${
                        isCollapsed 
                        ? 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-stone-300' 
                        : 'bg-[#7f4e1c] border-[#7f4e1c] text-white shadow-[#7f4e1c]/20 hover:bg-[#6c4217]'
                      }`}
                    >
                      {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 mt-0.5" />}
                    </button>
                  ) : (
                    <div className="w-1.5 h-1.5 rounded-full bg-stone-300" />
                  )}
                </div>

                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border z-10 ${
                  isMatched
                  ? 'bg-amber-100 text-[#7f4e1c] border-[#7f4e1c]/30 shadow-sm'
                  : node.isCurrentUser 
                  ? 'bg-primary/20 text-[#7f4e1c] border-primary/30 shadow-sm' 
                  : node.status === 'active' 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                  : 'bg-amber-50 text-amber-700 border-amber-100'
                }`}>
                  {node.name.charAt(0)}
                </div>
                
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="font-bold text-sm text-stone-800 truncate flex items-center gap-1.5 leading-tight">
                    {node.name}
                    {node.isCurrentUser && <span className="bg-[#7f4e1c] text-white text-[8px] px-1.5 py-0.5 rounded uppercase font-extrabold tracking-wider">YOU</span>}
                  </div>
                  {node.id !== rootNode.id && (
                    <div className="text-[10px] text-stone-500 font-mono mt-0.5">ID: {node.id}</div>
                  )}
                </div>
              </div>

              {/* Level Col */}
              <div className="lg:col-span-2 text-stone-600 text-sm font-medium pl-14 lg:pl-0 flex items-center gap-2">
                {node.id !== rootNode.id && (
                  <>
                    <span className="lg:hidden text-[10px] uppercase font-bold text-stone-400">Level:</span>
                    Level {node.level}
                  </>
                )}
              </div>

              {/* Investment Col */}
              <div className="lg:col-span-2 hidden md:flex items-center justify-end text-stone-800 font-bold text-sm">
                {node.id !== rootNode.id ? node.totalInvested : <span className="text-stone-300">-</span>}
              </div>

              {/* Status Col */}
              <div className="lg:col-span-2 flex justify-end pl-14 lg:pl-0">
                {node.id === rootNode.id ? (
                  <span className="text-[11px] text-stone-400 font-bold uppercase tracking-wider bg-stone-100 px-2 py-1 rounded-md">Root Node</span>
                ) : (
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                    node.status === 'active' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' 
                    : 'bg-amber-50 text-amber-700 border-amber-200/60'
                  }`}>
                    {node.status}
                  </span>
                )}
              </div>
              
              {/* Mobile Only Investment */}
              {node.id !== rootNode.id && (
                <div className="md:hidden col-span-1 pl-14 mt-1 flex items-center text-xs">
                   <span className="text-[10px] uppercase font-bold text-stone-400 mr-2">Investment:</span>
                   <span className="font-bold text-stone-800">{node.totalInvested}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
