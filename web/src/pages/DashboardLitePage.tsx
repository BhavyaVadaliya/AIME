import React, { useEffect, useState } from 'react';
import { Shield, Filter, BarChart3, Clock, AlertTriangle, CheckCircle2, Layers, Info, Play, Loader2, MessageSquare } from 'lucide-react';
import { SignalDetailPanel } from '../components/SignalDetailPanel';
import { ExternalSourceIcon } from '../components/ExternalSourceIcon';
import { SourceLinkButton, checkIdentityMatch } from '../components/SourceLinkButton';

interface Signal {
    signal_id: string;
    correlation_id: string;
    structured_post?: {
        raw_text: string;
        classification: {
            primary_category: string;
            signal_type: string;
            context_tags?: string[];
        };
        governance_route: {
            queue: string;
        };
        signal_score: {
            score: number;
        };
        priority_tier: string;
        source?: {
            platform: string;
            username: string;
            author_id: string;
            source_url: string;
            timestamp: string;
        };
        source_distribution?: {
            status: string;
            cluster_count: number;
            visibility_rank: number;
            is_source_overflow: boolean;
        };
        duplicate_control?: {
            cluster_id: string;
            duplicate_type: string;
            is_cluster_representative: boolean;
            cluster_size: number;
            collapsed: boolean;
        };
        low_intent_noise?: {
            is_low_intent: boolean;
            matched_pattern?: string;
            noise_category?: string;
            low_intent_phrase_overridden?: boolean;
            override_reason?: string;
        };
        discussion_metadata?: any;
    };
    source_distribution?: {
        status: string;
        cluster_count: number;
        visibility_rank: number;
        is_source_overflow: boolean;
    };
    duplicate_control?: {
        cluster_id: string;
        duplicate_type: string;
        is_cluster_representative: boolean;
        cluster_size: number;
        collapsed: boolean;
    };
    low_intent_noise?: {
        is_low_intent: boolean;
        matched_pattern?: string;
        noise_category?: string;
        low_intent_phrase_overridden?: boolean;
        override_reason?: string;
    };
    approval_status?: {
        state: string;
    };
    is_synthetic?: boolean;
    qualification_state?: string;
    review_state?: string;
    approval_state?: string;
    followup_state?: string;
    selected_cta?: string;
}

export const SYNTHETIC_DEMO_SIGNALS: Signal[] = [
    {
        signal_id: "demo-sig-nurse",
        correlation_id: "corr-demo-sig-nurse",
        is_synthetic: true,
        qualification_state: "Qualified",
        review_state: "Review Required",
        approval_state: "Approval Required",
        followup_state: "Follow-Up Complete",
        selected_cta: "trust_only",
        structured_post: {
            raw_text: "Experienced Registered Nurse seeking advisory support for career transition options.",
            classification: {
                primary_category: "TRANSITION_SEEKER",
                signal_type: "nurse_transition",
                context_tags: ["personal_exploration_candidate"]
            },
            governance_route: {
                queue: "demo_synthetic_queue"
            },
            signal_score: {
                score: 8
            },
            priority_tier: "HIGH",
            source: {
                platform: "synthetic_source",
                username: "nurse_advisor_demo",
                author_id: "synthetic-author-001",
                source_url: "demo-routing://synthetic-payload/nurse",
                timestamp: new Date().toISOString()
            },
            discussion_metadata: {
                discussion_source_type: "reply",
                discussion_depth: 1,
                source_type: "help_seeker",
                qualification_reason: "High-value professional seeking active career transition assistance.",
                matched_phrase: "career transition",
                author_handle: "nurse_advisor_demo"
            }
        },
        approval_status: {
            state: "Approval Required"
        }
    },
    {
        signal_id: "demo-sig-chiro",
        correlation_id: "corr-demo-sig-chiro",
        is_synthetic: true,
        qualification_state: "Qualified",
        review_state: "Review Required",
        approval_state: "Approval Required",
        followup_state: "Follow-Up Complete",
        selected_cta: "trust_only",
        structured_post: {
            raw_text: "Licensed Chiropractor seeking to add digital rehabilitation workflows into my private practice.",
            classification: {
                primary_category: "TRANSITION_SEEKER",
                signal_type: "chiropractic_workflow",
                context_tags: ["personal_exploration_candidate"]
            },
            governance_route: {
                queue: "demo_synthetic_queue"
            },
            signal_score: {
                score: 7
            },
            priority_tier: "MEDIUM",
            source: {
                platform: "synthetic_source",
                username: "chiro_steve_demo",
                author_id: "synthetic-author-002",
                source_url: "demo-routing://synthetic-payload/chiro",
                timestamp: new Date().toISOString()
            },
            discussion_metadata: {
                discussion_source_type: "comment",
                discussion_depth: 2,
                source_type: "transition_seeker",
                qualification_reason: "Licensed chiropractor looking to pivot into digital wellness pathways.",
                matched_phrase: "rehabilitation workflows",
                author_handle: "chiro_steve_demo"
            }
        },
        approval_status: {
            state: "Approval Required"
        }
    },
    {
        signal_id: "demo-sig-medfit",
        correlation_id: "corr-demo-sig-medfit",
        is_synthetic: true,
        qualification_state: "Review Required",
        review_state: "Review Required",
        approval_state: "Approval Required",
        followup_state: "Follow-Up Complete",
        selected_cta: "trust_only",
        structured_post: {
            raw_text: "Medical clinic assistant asking if they can provide nutritional consulting packages under current practice guidelines.",
            classification: {
                primary_category: "HELP_SEEKER",
                signal_type: "nutritional_consulting",
                context_tags: ["help_seeking_candidate"]
            },
            governance_route: {
                queue: "demo_synthetic_queue"
            },
            signal_score: {
                score: 5
            },
            priority_tier: "MEDIUM",
            source: {
                platform: "synthetic_source",
                username: "assistant_anna_demo",
                author_id: "synthetic-author-003",
                source_url: "demo-routing://synthetic-payload/medfit",
                timestamp: new Date().toISOString()
            },
            discussion_metadata: {
                discussion_source_type: "reply",
                discussion_depth: 1,
                source_type: "help_seeker",
                qualification_reason: "Clinical staff inquiring about scope-of-practice and consulting guidelines.",
                matched_phrase: "practice guidelines",
                author_handle: "assistant_anna_demo"
            }
        },
        approval_status: {
            state: "Approval Required"
        }
    },
    {
        signal_id: "demo-sig-suppseller",
        correlation_id: "corr-demo-sig-suppseller",
        is_synthetic: true,
        qualification_state: "Suppressed",
        review_state: "Reviewed",
        approval_state: "Approval Complete",
        followup_state: "Follow-Up Complete",
        selected_cta: "trust_only",
        structured_post: {
            raw_text: "Direct supplement seller promoting proprietary fat-loss pills with guaranteed results.",
            classification: {
                primary_category: "UNCLASSIFIED",
                signal_type: "supplement_sales",
                context_tags: ["commercial_seller_suppressed"]
            },
            governance_route: {
                queue: "demo_synthetic_queue"
            },
            signal_score: {
                score: 1
            },
            priority_tier: "LOW",
            source: {
                platform: "synthetic_source",
                username: "supplement_bob_demo",
                author_id: "synthetic-author-004",
                source_url: "demo-routing://synthetic-payload/suppseller",
                timestamp: new Date().toISOString()
            },
            discussion_metadata: {
                discussion_source_type: "comment",
                discussion_depth: 1,
                source_type: "creator_seller",
                qualification_reason: "Unqualified seller promoting health products with income/potency claims.",
                matched_phrase: "fat-loss pills",
                author_handle: "supplement_bob_demo"
            }
        },
        approval_status: {
            state: "Approval Required"
        }
    },
    {
        signal_id: "demo-sig-exagincome",
        correlation_id: "corr-demo-sig-exagincome",
        is_synthetic: true,
        qualification_state: "Review Required",
        review_state: "Review Required",
        approval_state: "Approval Required",
        followup_state: "Follow-Up Complete",
        selected_cta: "trust_only",
        structured_post: {
            raw_text: "Independent practitioner looking for ways to double clinical revenue within 30 days using automated client upselling.",
            classification: {
                primary_category: "HELP_SEEKER",
                signal_type: "revenue_growth",
                context_tags: ["commercial_intent_candidate"]
            },
            governance_route: {
                queue: "demo_synthetic_queue"
            },
            signal_score: {
                score: 4
            },
            priority_tier: "MEDIUM",
            source: {
                platform: "synthetic_source",
                username: "practitioner_paul_demo",
                author_id: "synthetic-author-005",
                source_url: "demo-routing://synthetic-payload/exagincome",
                timestamp: new Date().toISOString()
            },
            discussion_metadata: {
                discussion_source_type: "comment",
                discussion_depth: 2,
                source_type: "help_seeker",
                qualification_reason: "Aggressive business expansion model requiring review for professional policy alignment.",
                matched_phrase: "double clinical revenue",
                author_handle: "practitioner_paul_demo"
            }
        },
        approval_status: {
            state: "Approval Required"
        }
    },
    {
        signal_id: "demo-sig-compliance",
        correlation_id: "corr-demo-sig-compliance",
        is_synthetic: true,
        qualification_state: "Compliance Review Required",
        review_state: "Review Required",
        approval_state: "Approval Required",
        followup_state: "Follow-Up Complete",
        selected_cta: "trust_only",
        structured_post: {
            raw_text: "Provider requesting advice on off-label prescription advertising guidelines and HIPAA override practices.",
            classification: {
                primary_category: "COMPLIANCE_RISK",
                signal_type: "advertising_guidelines",
                context_tags: ["compliance_risk_candidate"]
            },
            governance_route: {
                queue: "demo_synthetic_queue"
            },
            signal_score: {
                score: 9
            },
            priority_tier: "HIGH",
            source: {
                platform: "synthetic_source",
                username: "dr_clara_demo",
                author_id: "synthetic-author-006",
                source_url: "demo-routing://synthetic-payload/compliance",
                timestamp: new Date().toISOString()
            },
            discussion_metadata: {
                discussion_source_type: "reply",
                discussion_depth: 1,
                source_type: "help_seeker",
                qualification_reason: "High compliance risk: request details on HIPAA overrides and off-label promotions.",
                matched_phrase: "HIPAA override",
                author_handle: "dr_clara_demo"
            }
        },
        approval_status: {
            state: "Approval Required"
        }
    },
    {
        signal_id: "demo-sig-followup",
        correlation_id: "corr-demo-sig-followup",
        is_synthetic: true,
        qualification_state: "Follow-Up Required",
        review_state: "Review Required",
        approval_state: "Approval Required",
        followup_state: "Follow-Up Required",
        selected_cta: "trust_only",
        structured_post: {
            raw_text: "Patient transition inquiry requesting immediate follow-up on clinical referral options.",
            classification: {
                primary_category: "TRANSITION_SEEKER",
                signal_type: "referral_options",
                context_tags: ["follow_up_candidate"]
            },
            governance_route: {
                queue: "demo_synthetic_queue"
            },
            signal_score: {
                score: 8
            },
            priority_tier: "HIGH",
            source: {
                platform: "synthetic_source",
                username: "patient_pat_demo",
                author_id: "synthetic-author-007",
                source_url: "demo-routing://synthetic-payload/followup",
                timestamp: new Date().toISOString()
            },
            discussion_metadata: {
                discussion_source_type: "comment",
                discussion_depth: 1,
                source_type: "help_seeker",
                qualification_reason: "Critical follow-up requested by transitioning patient.",
                matched_phrase: "immediate follow-up",
                author_handle: "patient_pat_demo"
            }
        },
        approval_status: {
            state: "Approval Required"
        }
    }
];

export const DashboardLitePage: React.FC = () => {
    const [signals, setSignals] = useState<Signal[]>([]);
    const [demoMode, setDemoMode] = useState(false);
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterTier, setFilterTier] = useState('All');
    const [filterQueue, setFilterQueue] = useState('All');
    const [loading, setLoading] = useState(true);
    const [showLowValue, setShowLowValue] = useState(false);
    const [showLowIntent, setShowLowIntent] = useState(false);
    const [selectedSignal, setSelectedSignal] = useState<Signal | null>(null);
    const [scanStatus, setScanStatus] = useState<'Idle' | 'Running' | 'Complete' | 'Failed'>('Idle');
    const [expandedCreators, setExpandedCreators] = useState<Record<string, boolean>>({});
    const [expandedDuplicates, setExpandedDuplicates] = useState<Record<string, boolean>>({});

    const activeSignalsList = demoMode ? SYNTHETIC_DEMO_SIGNALS : signals;

    const toggleCreator = (username: string) => {
        setExpandedCreators(prev => ({
            ...prev,
            [username]: !prev[username]
        }));
    };

    const toggleDuplicateCluster = (clusterId: string) => {
        setExpandedDuplicates(prev => ({
            ...prev,
            [clusterId]: !prev[clusterId]
        }));
    };

    const fetchData = async () => {
        try {
            const apiUrl = import.meta.env.VITE_API_URL || 
                          (window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://aime-0vwz.onrender.com');
            const response = await fetch(`${apiUrl}/admin/governance/signals`);


            const data = await response.json();
            
            // Map signals from Supabase structure
            const mapped = data.map((entry: any) => {
                let sp = entry.structured_post;
                // Handle double-nesting if present
                if (sp?.structured_post) sp = sp.structured_post;
                
                return {
                    signal_id: entry.signal_id,
                    correlation_id: entry.correlation_id || `corr-${entry.signal_id}`,
                    structured_post: sp,
                    source_distribution: entry.source_distribution || sp?.source_distribution,
                    duplicate_control: entry.duplicate_control || sp?.duplicate_control,
                    low_intent_noise: entry.low_intent_noise || sp?.low_intent_noise
                };
            });



            setSignals(mapped);
            setLoading(false);

        } catch (error) {
            console.error('Error fetching signals:', error);
            setLoading(false);
        }
    };

    const handleRunScan = async () => {
        if (scanStatus === 'Running') return;
        setScanStatus('Running');
        try {
            const apiUrl = import.meta.env.VITE_API_URL ||
                (window.location.hostname === 'localhost' ? 'http://localhost:4000' : 'https://aime-0vwz.onrender.com');
            const response = await fetch(`${apiUrl}/admin/governance/scan`, { method: 'POST' });
            const scanData = await response.json();

            if (response.ok && scanData.status === 'success') {
                const count = scanData.data?.batch_size || 0;
                setScanStatus('Complete');
                if (count > 0) {
                    fetchData(); // Refresh feed with new signals
                    console.log(`[Scan] ${count} new signals ingested.`);
                }
                setTimeout(() => setScanStatus('Idle'), 3000);
            } else {
                console.error('[Scan] Failed:', scanData);
                setScanStatus('Failed');
                setTimeout(() => setScanStatus('Idle'), 4000);
            }
        } catch (error: any) {
            console.error('[Scan] Network error:', error.message);
            setScanStatus('Failed');
            setTimeout(() => setScanStatus('Idle'), 4000);
        }
    };


    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000); // Polling every 5s
        return () => clearInterval(interval);
    }, []);

    // UI GROUPING LOGIC (S11-T01 requirement: NO backend deduplication)
    const processedSignals = React.useMemo(() => {
        const groups: Record<string, { signal: Signal, count: number }> = {};
        
        activeSignalsList.forEach(s => {
            const key = s.structured_post?.raw_text || s.signal_id;
            if (!groups[key]) {
                groups[key] = { signal: s, count: 1 };
            } else {
                groups[key].count += 1;
            }
        });

        return Object.values(groups);
    }, [activeSignalsList]);

    const filteredSignals = processedSignals.filter(({ signal: s }) => {
        const catMatch = filterCategory === 'All' || s.structured_post?.classification.primary_category === filterCategory;
        const tierMatch = filterTier === 'All' || s.structured_post?.priority_tier === filterTier;
        const queueMatch = filterQueue === 'All' || s.structured_post?.governance_route.queue === filterQueue;
        return catMatch && tierMatch && queueMatch;
    });

    const metrics = {
        total: activeSignalsList.length,
        unique: processedSignals.length,
        high: activeSignalsList.filter(s => s.structured_post?.priority_tier === 'HIGH').length,
        med: activeSignalsList.filter(s => s.structured_post?.priority_tier === 'MEDIUM').length,
        low: activeSignalsList.filter(s => s.structured_post?.priority_tier === 'LOW').length,
        highRiskQueue: activeSignalsList.filter(s => s.structured_post?.governance_route.queue === 'higher_risk').length,
    };

    const categories = ['All', ...new Set(activeSignalsList.map(s => s.structured_post?.classification.primary_category).filter(Boolean)) as Set<string>];

    const mapCategoryLabel = (cat: string) => cat === 'UNCLASSIFIED' ? 'General' : cat;

    const isLowIntent = (s: Signal) => s.low_intent_noise?.is_low_intent === true || s.structured_post?.low_intent_noise?.is_low_intent === true;
    const isLowValue = (s: Signal) => !isLowIntent(s) && s.structured_post?.priority_tier === 'LOW' && (s.structured_post?.signal_score?.score || 0) <= 3;

    const filteredRawSignals = React.useMemo(() => {
        return activeSignalsList.filter(s => {
            const catMatch = filterCategory === 'All' || s.structured_post?.classification.primary_category === filterCategory;
            const tierMatch = filterTier === 'All' || s.structured_post?.priority_tier === filterTier;
            const queueMatch = filterQueue === 'All' || s.structured_post?.governance_route.queue === filterQueue;
            return catMatch && tierMatch && queueMatch;
        });
    }, [activeSignalsList, filterCategory, filterTier, filterQueue]);

    const standardSignals = React.useMemo(() => filteredRawSignals.filter(s => !isLowValue(s) && !isLowIntent(s)), [filteredRawSignals]);
    const lowValueSignals = React.useMemo(() => filteredRawSignals.filter(s => isLowValue(s)), [filteredRawSignals]);
    const lowIntentSignals = React.useMemo(() => filteredRawSignals.filter(s => isLowIntent(s)), [filteredRawSignals]);

    const getCreatorGroups = (signalsList: Signal[]) => {
        const groups: Record<string, { username: string, visible: Signal[], overflow: Signal[] }> = {};
        
        signalsList.forEach(s => {
            const username = s.structured_post?.source?.username || 'unknown';
            if (!groups[username]) {
                groups[username] = { username, visible: [], overflow: [] };
            }
            
            // Exclude collapsed duplicate variants from creator's top-level lists
            if (s.duplicate_control?.collapsed === true) {
                return;
            }
            
            const isOverflow = s.source_distribution?.is_source_overflow || s.structured_post?.source_distribution?.is_source_overflow;
            if (isOverflow) {
                groups[username].overflow.push(s);
            } else {
                groups[username].visible.push(s);
            }
        });

        Object.values(groups).forEach(g => {
            if (g.visible.length === 0 && g.overflow.length > 0) {
                g.visible.push(g.overflow[0]);
                g.overflow = g.overflow.slice(1);
            }
        });

        return Object.values(groups);
    };

    const standardGroups = React.useMemo(() => getCreatorGroups(standardSignals), [standardSignals]);
    const lowValueGroups = React.useMemo(() => getCreatorGroups(lowValueSignals), [lowValueSignals]);
    const lowIntentGroups = React.useMemo(() => getCreatorGroups(lowIntentSignals), [lowIntentSignals]);

    return (
        <div className="min-h-screen bg-[#0f172a] text-slate-200 p-8 font-['Inter']">
            {/* Sticky Warning Banner */}
            {demoMode && (
                <div className="bg-amber-500/20 border border-amber-500/30 text-amber-300 px-6 py-3.5 flex justify-between items-center text-xs font-black tracking-widest uppercase backdrop-blur-md rounded-2xl mb-8 animate-pulse shadow-lg shadow-amber-900/10">
                    <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
                        <span>⚠️ SYNTHETIC DATA | DEMO MODE | NOT LIVE DATA</span>
                    </div>
                    <div className="flex gap-6 items-center">
                        <span className="bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 text-[10px]">S15-T01 ACTIVE</span>
                        <span>DEMO DISCLOSURES MANDATORY</span>
                    </div>
                </div>
            )}

            {/* Header */}
            <header className="flex justify-between items-center mb-12">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-2">
                        Governance Dashboard <span className="text-slate-500 font-light text-2xl ml-2">Lite</span>
                    </h1>
                    <p className="text-slate-400 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-cyan-400" />
                        Live Signal Observability Layer (Read-Only)
                    </p>
                </div>
                <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 flex gap-8">
                    <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Total Signals</p>
                        <p className="text-2xl font-mono text-white">{metrics.total}</p>
                    </div>
                    <div className="w-px bg-slate-700" />
                    <div className="text-center">
                        <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">High Priority</p>
                        <p className="text-2xl font-mono text-red-400">{metrics.high}</p>
                    </div>

                    {/* Run Scan Utility Button */}
                    <div className="flex items-center gap-4 ml-6 pl-6 border-l border-slate-700">
                        <button
                            onClick={handleRunScan}
                            disabled={scanStatus === 'Running'}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${
                                scanStatus === 'Running' 
                                ? 'bg-slate-700 text-slate-400 cursor-not-allowed' 
                                : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 active:scale-95'
                            }`}
                        >
                            {scanStatus === 'Running' ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Play className="w-4 h-4 fill-current" />
                            )}
                            Run Scan
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Scan Status</span>
                            <span className={`text-xs font-mono font-bold ${
                                scanStatus === 'Running' ? 'text-amber-400' :
                                scanStatus === 'Complete' ? 'text-emerald-400' :
                                scanStatus === 'Failed' ? 'text-red-400' : 'text-slate-400'
                            }`}>
                                {scanStatus}
                            </span>
                        </div>
                    </div>

                    {/* Synthetic Demo Mode Toggle Button */}
                    <div className="flex items-center gap-4 ml-6 pl-6 border-l border-slate-700">
                        <button
                            onClick={() => setDemoMode(!demoMode)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 active:scale-95 ${
                                demoMode 
                                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-900/30 border border-amber-400/40' 
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300 border border-slate-600/30'
                            }`}
                        >
                            <Shield className="w-4 h-4 text-white" />
                            {demoMode ? 'Disable Demo' : 'Enable Demo Mode'}
                        </button>
                        <div className="flex flex-col">
                            <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Mode</span>
                            <span className={`text-xs font-mono font-bold ${demoMode ? 'text-amber-400' : 'text-slate-400'}`}>
                                {demoMode ? 'SYNTHETIC' : 'PRODUCTION'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Metrics Panel */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
                <MetricCard icon={<AlertTriangle className="text-red-400" />} label="High" value={metrics.high} color="border-red-500/30" bg="bg-red-500/5" />
                <MetricCard icon={<Clock className="text-amber-400" />} label="Medium" value={metrics.med} color="border-amber-500/30" bg="bg-amber-500/5" />
                <MetricCard icon={<CheckCircle2 className="text-emerald-400" />} label="Low" value={metrics.low} color="border-emerald-500/30" bg="bg-emerald-500/5" />
                <MetricCard icon={<BarChart3 className="text-blue-400" />} label="High Risk Queue" value={metrics.highRiskQueue} color="border-blue-500/30" bg="bg-blue-500/5" />
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 mb-8 items-center bg-slate-800/30 p-4 rounded-xl border border-slate-700/30 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-400">Filters:</span>
                </div>
                <select 
                    value={filterCategory} 
                    onChange={e => setFilterCategory(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <select 
                    value={filterTier} 
                    onChange={e => setFilterTier(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-cyan-500 outline-none"
                >
                    <option value="All">All Tiers</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                </select>
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                    {['All', 'low_risk', 'higher_risk'].map(q => (
                        <button
                            key={q}
                            onClick={() => setFilterQueue(q)}
                            className={`px-4 py-1 text-xs rounded-md transition-all ${filterQueue === q ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-500/20' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            {q === 'All' ? 'All Queues' : q.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Signal Feed */}
            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-20 animate-pulse text-slate-500">Connecting to node telemetry...</div>
                ) : filteredRawSignals.length === 0 ? (
                    <div className="text-center py-20 text-slate-600 border-2 border-dashed border-slate-800 rounded-3xl">No signals matched current filters</div>
                ) : (
                    <>
                        {/* Standard Signals grouped by creator */}
                        {standardGroups.map((group) => {
                            const isExpanded = !!expandedCreators[group.username];
                            return (
                                <div key={group.username} className="space-y-3">
                                    {group.visible.map(signal => {
                                        const clusterId = signal.duplicate_control?.cluster_id;
                                        const isRepresentative = signal.duplicate_control?.is_cluster_representative === true;
                                        const clusterSize = signal.duplicate_control?.cluster_size || 1;
                                        
                                        const collapsedDuplicates = (isRepresentative && clusterSize > 1 && clusterId)
                                            ? activeSignalsList.filter(x => x.duplicate_control?.cluster_id === clusterId && x.duplicate_control?.collapsed === true)
                                            : [];
                                            
                                        const isDupExpanded = !!expandedDuplicates[clusterId || ''];
                                        
                                        return (
                                            <div key={signal.signal_id} className="space-y-3">
                                                <SignalRow 
                                                    signal={signal} 
                                                    count={1} 
                                                    mapCategoryLabel={mapCategoryLabel} 
                                                    onClick={() => setSelectedSignal(signal)}
                                                />
                                                
                                                {collapsedDuplicates.length > 0 && (
                                                    <div className="pl-6 space-y-3 border-l-2 border-slate-700/50">
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleDuplicateCluster(clusterId!);
                                                            }}
                                                            className="flex items-center justify-between w-full p-3 bg-slate-800/10 hover:bg-slate-800/30 border border-slate-700/20 hover:border-slate-500/20 text-slate-400 hover:text-slate-200 transition-all rounded-xl cursor-pointer select-none active:scale-[0.99]"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <Layers className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                                                <span className="font-semibold text-slate-400 text-xs tracking-wide">
                                                                    {isDupExpanded ? 'Hide' : 'Show'} {collapsedDuplicates.length} similar repetitive signal{collapsedDuplicates.length > 1 ? 's' : ''} collapsed
                                                                </span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                                                                    {isDupExpanded ? 'Collapse' : 'Expand'}
                                                                </span>
                                                                <span className="text-[9px] bg-slate-900/60 text-amber-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                                                                    +{collapsedDuplicates.length}
                                                                </span>
                                                            </div>
                                                        </button>
                                                        
                                                        {isDupExpanded && collapsedDuplicates.map(dupSignal => (
                                                            <div key={dupSignal.signal_id} className="opacity-90 scale-[0.98] origin-top transition-all duration-300">
                                                                <SignalRow 
                                                                    signal={dupSignal} 
                                                                    count={1} 
                                                                    mapCategoryLabel={mapCategoryLabel} 
                                                                    onClick={() => setSelectedSignal(dupSignal)}
                                                                />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                    
                                    {group.overflow.length > 0 && (
                                        <div className="space-y-3 pl-4 border-l-2 border-slate-800/80">
                                            <OverflowCollapse 
                                                username={group.username}
                                                count={group.overflow.length}
                                                isExpanded={isExpanded}
                                                onToggle={() => toggleCreator(group.username)}
                                            />
                                            
                                            {isExpanded && group.overflow.map(signal => {
                                                const clusterId = signal.duplicate_control?.cluster_id;
                                                const isRepresentative = signal.duplicate_control?.is_cluster_representative === true;
                                                const clusterSize = signal.duplicate_control?.cluster_size || 1;
                                                
                                                const collapsedDuplicates = (isRepresentative && clusterSize > 1 && clusterId)
                                                    ? activeSignalsList.filter(x => x.duplicate_control?.cluster_id === clusterId && x.duplicate_control?.collapsed === true)
                                                    : [];
                                                    
                                                const isDupExpanded = !!expandedDuplicates[clusterId || ''];
                                                
                                                return (
                                                    <div key={signal.signal_id} className="space-y-3 opacity-95 scale-[0.99] origin-top transition-all duration-300">
                                                        <SignalRow 
                                                            signal={signal} 
                                                            count={1} 
                                                            mapCategoryLabel={mapCategoryLabel} 
                                                            onClick={() => setSelectedSignal(signal)}
                                                        />
                                                        
                                                        {collapsedDuplicates.length > 0 && (
                                                            <div className="pl-6 space-y-3 border-l-2 border-slate-700/50">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        toggleDuplicateCluster(clusterId!);
                                                                    }}
                                                                    className="flex items-center justify-between w-full p-3 bg-slate-800/10 hover:bg-slate-800/30 border border-slate-700/20 hover:border-slate-500/20 text-slate-400 hover:text-slate-200 transition-all rounded-xl cursor-pointer select-none active:scale-[0.99]"
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                                                                        <span className="font-semibold text-slate-400 text-xs tracking-wide">
                                                                            {isDupExpanded ? 'Hide' : 'Show'} {collapsedDuplicates.length} similar repetitive signal{collapsedDuplicates.length > 1 ? 's' : ''} collapsed
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                                                                            {isDupExpanded ? 'Collapse' : 'Expand'}
                                                                        </span>
                                                                        <span className="text-[9px] bg-slate-900/60 text-amber-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                                                                            +{collapsedDuplicates.length}
                                                                        </span>
                                                                    </div>
                                                                </button>
                                                                
                                                                {isDupExpanded && collapsedDuplicates.map(dupSignal => (
                                                                    <div key={dupSignal.signal_id} className="opacity-90 scale-[0.98] origin-top transition-all duration-300">
                                                                        <SignalRow 
                                                                            signal={dupSignal} 
                                                                            count={1} 
                                                                            mapCategoryLabel={mapCategoryLabel} 
                                                                            onClick={() => setSelectedSignal(dupSignal)}
                                                                        />
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}

                        {/* Low Value Signals Section */}
                        {lowValueSignals.length > 0 && (
                            <div className="mt-8">
                                <button 
                                    onClick={() => setShowLowValue(!showLowValue)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-900/50 hover:bg-slate-900 border border-slate-800 rounded-xl text-slate-500 text-sm transition-all"
                                >
                                    <div className="flex items-center gap-2">
                                        <Info className="w-4 h-4" />
                                        <span>{lowValueSignals.length} Low Value Signals {showLowValue ? 'Visible' : 'Hidden'}</span>
                                    </div>
                                    <span>{showLowValue ? 'Collapse' : 'Expand'}</span>
                                </button>
                                
                                {showLowValue && (
                                    <div className="space-y-4 mt-4 opacity-70 grayscale-[0.3]">
                                        {lowValueGroups.map((group) => {
                                            const isExpanded = !!expandedCreators[group.username];
                                            return (
                                                <div key={group.username} className="space-y-3">
                                                    {group.visible.map(signal => {
                                                        const clusterId = signal.duplicate_control?.cluster_id;
                                                        const isRepresentative = signal.duplicate_control?.is_cluster_representative === true;
                                                        const clusterSize = signal.duplicate_control?.cluster_size || 1;
                                                        
                                                        const collapsedDuplicates = (isRepresentative && clusterSize > 1 && clusterId)
                                                            ? activeSignalsList.filter(x => x.duplicate_control?.cluster_id === clusterId && x.duplicate_control?.collapsed === true)
                                                            : [];
                                                            
                                                        const isDupExpanded = !!expandedDuplicates[clusterId || ''];
                                                        
                                                        return (
                                                            <div key={signal.signal_id} className="space-y-3">
                                                                <SignalRow 
                                                                    signal={signal} 
                                                                    count={1} 
                                                                    mapCategoryLabel={mapCategoryLabel} 
                                                                    isLowValue 
                                                                    onClick={() => setSelectedSignal(signal)}
                                                                />
                                                                
                                                                {collapsedDuplicates.length > 0 && (
                                                                    <div className="pl-6 space-y-3 border-l-2 border-slate-700/50">
                                                                        <button
                                                                            onClick={(e) => {
                                                                                e.stopPropagation();
                                                                                toggleDuplicateCluster(clusterId!);
                                                                            }}
                                                                            className="flex items-center justify-between w-full p-3 bg-slate-800/10 hover:bg-slate-800/30 border border-slate-700/20 hover:border-slate-500/20 text-slate-400 hover:text-slate-200 transition-all rounded-xl cursor-pointer select-none active:scale-[0.99]"
                                                                        >
                                                                            <div className="flex items-center gap-2">
                                                                                <Layers className="w-3.5 h-3.5 text-amber-500" />
                                                                                <span className="font-semibold text-slate-400 text-xs tracking-wide">
                                                                                    {isDupExpanded ? 'Hide' : 'Show'} {collapsedDuplicates.length} similar repetitive signal{collapsedDuplicates.length > 1 ? 's' : ''} collapsed
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                                                                                    {isDupExpanded ? 'Collapse' : 'Expand'}
                                                                                </span>
                                                                                <span className="text-[9px] bg-slate-900/60 text-amber-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                                                                                    +{collapsedDuplicates.length}
                                                                                </span>
                                                                            </div>
                                                                        </button>
                                                                        
                                                                        {isDupExpanded && collapsedDuplicates.map(dupSignal => (
                                                                            <div key={dupSignal.signal_id} className="opacity-90 scale-[0.98] origin-top transition-all duration-300">
                                                                                <SignalRow 
                                                                                    signal={dupSignal} 
                                                                                    count={1} 
                                                                                    mapCategoryLabel={mapCategoryLabel} 
                                                                                    isLowValue 
                                                                                    onClick={() => setSelectedSignal(dupSignal)}
                                                                                />
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                    
                                                    {group.overflow.length > 0 && (
                                                        <div className="space-y-3 pl-4 border-l-2 border-slate-800/80">
                                                            <OverflowCollapse 
                                                                username={group.username}
                                                                count={group.overflow.length}
                                                                isExpanded={isExpanded}
                                                                onToggle={() => toggleCreator(group.username)}
                                                            />
                                                            
                                                            {isExpanded && group.overflow.map(signal => {
                                                                const clusterId = signal.duplicate_control?.cluster_id;
                                                                const isRepresentative = signal.duplicate_control?.is_cluster_representative === true;
                                                                const clusterSize = signal.duplicate_control?.cluster_size || 1;
                                                                
                                                                const collapsedDuplicates = (isRepresentative && clusterSize > 1 && clusterId)
                                                                    ? activeSignalsList.filter(x => x.duplicate_control?.cluster_id === clusterId && x.duplicate_control?.collapsed === true)
                                                                    : [];
                                                                    
                                                                const isDupExpanded = !!expandedDuplicates[clusterId || ''];
                                                                
                                                                return (
                                                                    <div key={signal.signal_id} className="space-y-3 opacity-95 scale-[0.99] origin-top transition-all duration-300">
                                                                        <SignalRow 
                                                                            signal={signal} 
                                                                            count={1} 
                                                                            mapCategoryLabel={mapCategoryLabel} 
                                                                            isLowValue 
                                                                            onClick={() => setSelectedSignal(signal)}
                                                                        />
                                                                        
                                                                        {collapsedDuplicates.length > 0 && (
                                                                            <div className="pl-6 space-y-3 border-l-2 border-slate-700/50">
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        toggleDuplicateCluster(clusterId!);
                                                                                    }}
                                                                                    className="flex items-center justify-between w-full p-3 bg-slate-800/10 hover:bg-slate-800/30 border border-slate-700/20 hover:border-slate-500/20 text-slate-400 hover:text-slate-200 transition-all rounded-xl cursor-pointer select-none active:scale-[0.99]"
                                                                                >
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Layers className="w-3.5 h-3.5 text-amber-500" />
                                                                                        <span className="font-semibold text-slate-400 text-xs tracking-wide">
                                                                                            {isDupExpanded ? 'Hide' : 'Show'} {collapsedDuplicates.length} similar repetitive signal{collapsedDuplicates.length > 1 ? 's' : ''} collapsed
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2">
                                                                                        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-bold">
                                                                                            {isDupExpanded ? 'Collapse' : 'Expand'}
                                                                                        </span>
                                                                                        <span className="text-[9px] bg-slate-900/60 text-amber-400 border border-slate-800 px-2 py-0.5 rounded font-mono font-bold">
                                                                                            +{collapsedDuplicates.length}
                                                                                        </span>
                                                                                    </div>
                                                                                </button>
                                                                                
                                                                                {isDupExpanded && collapsedDuplicates.map(dupSignal => (
                                                                                    <div key={dupSignal.signal_id} className="opacity-90 scale-[0.98] origin-top transition-all duration-300">
                                                                                        <SignalRow 
                                                                                            signal={dupSignal} 
                                                                                            count={1} 
                                                                                            mapCategoryLabel={mapCategoryLabel} 
                                                                                            isLowValue 
                                                                                            onClick={() => setSelectedSignal(dupSignal)}
                                                                                        />
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Collapsed Low-Intent Signals Section */}
                        {lowIntentSignals.length > 0 && (
                            <div className="mt-6">
                                <button 
                                    onClick={() => setShowLowIntent(!showLowIntent)}
                                    className="w-full flex items-center justify-between p-4 bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 rounded-2xl text-slate-400 text-sm font-semibold tracking-wide transition-all backdrop-blur-md"
                                >
                                    <div className="flex items-center gap-2.5">
                                        <AlertTriangle className="w-4 h-4 text-amber-500/80 animate-pulse" />
                                        <span>{lowIntentSignals.length} Collapsed Low-Intent Signal{lowIntentSignals.length > 1 ? 's' : ''} {showLowIntent ? 'Visible' : 'Hidden'}</span>
                                    </div>
                                    <span className="text-xs bg-slate-800 text-slate-400 px-3 py-1 rounded-xl border border-slate-700/50">
                                        {showLowIntent ? 'Collapse' : 'Expand'}
                                    </span>
                                </button>
                                
                                {showLowIntent && (
                                    <div className="space-y-4 mt-4 opacity-75">
                                        {lowIntentGroups.map((group) => {
                                            const isExpanded = !!expandedCreators[group.username];
                                            return (
                                                <div key={group.username} className="space-y-3">
                                                    {group.visible.map(signal => (
                                                        <SignalRow 
                                                            key={signal.signal_id}
                                                            signal={signal} 
                                                            count={1} 
                                                            mapCategoryLabel={mapCategoryLabel} 
                                                            isLowValue 
                                                            onClick={() => setSelectedSignal(signal)}
                                                        />
                                                    ))}
                                                    {group.overflow.length > 0 && (
                                                        <div className="space-y-3 pl-4 border-l-2 border-slate-800/80">
                                                            <OverflowCollapse 
                                                                username={group.username}
                                                                count={group.overflow.length}
                                                                isExpanded={isExpanded}
                                                                onToggle={() => toggleCreator(group.username)}
                                                            />
                                                            {isExpanded && group.overflow.map(signal => (
                                                                <SignalRow 
                                                                    key={signal.signal_id}
                                                                    signal={signal} 
                                                                    count={1} 
                                                                    mapCategoryLabel={mapCategoryLabel} 
                                                                    isLowValue 
                                                                    onClick={() => setSelectedSignal(signal)}
                                                                />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <SignalDetailPanel 
                signal={selectedSignal} 
                onClose={() => setSelectedSignal(null)} 
                mapCategoryLabel={mapCategoryLabel} 
            />

            {/* Version Footer */}
            <footer className="mt-12 pt-8 border-t border-slate-800/50 flex justify-between items-center text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-4">
                    <span>AIME Governance Node v1.2.0</span>
                    <div className="w-1 h-1 rounded-full bg-slate-800" />
                    <span>Build: S11-T06-P1</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500/20 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    </div>
                    <span>Live Verification: May 01, 2026 (14:56)</span>
                </div>
            </footer>
        </div>
    );
};


const OverflowCollapse = ({ username, count, isExpanded, onToggle }: { username: string, count: number, isExpanded: boolean, onToggle: (e: any) => void }) => {
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                onToggle(e);
            }}
            className="w-full flex items-center justify-between p-4 bg-slate-800/20 hover:bg-slate-800/40 border border-slate-700/30 hover:border-slate-500/30 text-slate-400 hover:text-slate-200 transition-all duration-300 rounded-2xl backdrop-blur-md cursor-pointer select-none active:scale-[0.99]"
        >
            <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-semibold text-slate-300 text-xs tracking-wide">
                    {isExpanded ? 'Hide' : 'Show'} {count} more signal{count > 1 ? 's' : ''} from @{username}
                </span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">
                    {isExpanded ? 'Collapse' : 'Expand'}
                </span>
                <span className="text-[10px] bg-slate-900 text-cyan-400 border border-slate-800 px-2.5 py-0.5 rounded-lg font-mono font-bold">
                    +{count}
                </span>
            </div>
        </button>
    );
};

const SignalRow = ({ signal, count, mapCategoryLabel, isLowValue = false, onClick }: { signal: Signal, count: number, mapCategoryLabel: (c: string) => string, isLowValue?: boolean, onClick: () => void }) => {
    const s = signal.structured_post;
    const isSourceUnknown = !s?.source || s.source.platform === 'unknown' || s.source.username === 'unknown';

    return (
        <div 
            onClick={onClick}
            className={`group relative bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 hover:border-slate-500/50 transition-all duration-300 rounded-2xl p-6 backdrop-blur-md overflow-hidden cursor-pointer active:scale-[0.99] ${isLowValue ? 'border-dashed' : ''}`}
        >
            {/* Priority Indicator Line */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                s?.priority_tier === 'HIGH' ? 'bg-red-500' : 
                s?.priority_tier === 'MEDIUM' ? 'bg-amber-500' : 'bg-emerald-500'
            } ${s?.priority_tier === 'HIGH' ? 'shadow-[0_0_15px_rgba(239,68,68,0.5)]' : ''}`} />
            
            <div className="flex justify-between items-start">
                <div className="flex-1 pr-6">
                    <div className="flex items-center gap-3 mb-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-tighter uppercase ${
                            s?.priority_tier === 'HIGH' ? 'bg-red-500 text-white border border-red-400' : 
                            s?.priority_tier === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        }`}>
                            {s?.priority_tier}
                        </span>

                        {signal.is_synthetic && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">
                                DEMO MODE
                            </span>
                        )}
                        {signal.is_synthetic && (
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-400 border border-slate-700/50 rounded text-[10px] font-mono tracking-wider font-bold">
                                SYNTHETIC DATA
                            </span>
                        )}
                        {signal.is_synthetic && signal.qualification_state && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${
                                signal.qualification_state === 'Qualified' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                signal.qualification_state === 'Suppressed' ? 'bg-slate-950/60 text-slate-500 border-slate-800/80 line-through' :
                                signal.qualification_state === 'Review Required' ? 'bg-amber-500/15 text-amber-400 border-amber-500/30' :
                                signal.qualification_state === 'Compliance Review Required' ? 'bg-red-500/15 text-red-400 border-red-500/30' :
                                'bg-pink-500/10 text-pink-400 border-pink-500/20'
                            }`}>
                                Expected: {signal.qualification_state}
                            </span>
                        )}

                        {s?.discussion_metadata && (
                            <>
                                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                                    <MessageSquare className="w-3 h-3 text-indigo-400" />
                                    {s.discussion_metadata.discussion_source_type} (d{s.discussion_metadata.discussion_depth})
                                </span>
                                {s.discussion_metadata.source_type && (
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                        s.discussion_metadata.source_type === 'help_seeker' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30' :
                                        s.discussion_metadata.source_type === 'recommendation_seeker' ? 'bg-teal-500/15 text-teal-400 border border-teal-500/30' :
                                        s.discussion_metadata.source_type === 'transition_seeker' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                                        s.discussion_metadata.source_type === 'experience_sharer' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                                        s.discussion_metadata.source_type === 'creator_seller' ? 'bg-red-500/15 text-red-400 border border-red-500/30 line-through opacity-70' :
                                        'bg-slate-700/30 text-slate-400 border border-slate-600/30'
                                    }`}>
                                        {s.discussion_metadata.source_type.replace('_', ' ')}
                                    </span>
                                )}
                                {s.discussion_metadata.matched_phrase && (
                                    <span className="px-2 py-0.5 bg-pink-500/15 text-pink-400 border border-pink-500/30 rounded text-[10px] font-bold font-mono">
                                        Matched: "{s.discussion_metadata.matched_phrase}"
                                    </span>
                                )}
                                {s.discussion_metadata.conflict_resolved && (
                                    <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/30 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">
                                        Conflict Preserved
                                    </span>
                                )}
                            </>
                        )}

                        {s?.classification?.context_tags?.includes('prospect_candidate') && (
                            <span className="px-2 py-0.5 bg-pink-500/10 text-pink-400 border border-pink-500/30 rounded text-[10px] font-bold uppercase tracking-wider">
                                Prospect
                            </span>
                        )}
                        {s?.classification?.context_tags?.includes('multi_signal_boost') && (
                            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-400/40 rounded text-[10px] font-black uppercase tracking-widest animate-pulse">
                                Premium Boost
                            </span>
                        )}
                        
                        {count > 1 && (
                            <div className="flex items-center gap-1 bg-blue-500/10 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest">
                                <Layers className="w-3 h-3" />
                                x{count}
                            </div>
                        )}

                        {/* Low-Intent Badges */}
                        {(signal.low_intent_noise?.is_low_intent || s?.low_intent_noise?.is_low_intent) && (
                            <span className="px-2 py-0.5 bg-slate-700/30 text-slate-400 border border-slate-600/30 rounded text-[10px] font-bold uppercase tracking-wider">
                                Low-Intent: {signal.low_intent_noise?.matched_pattern || s?.low_intent_noise?.matched_pattern}
                            </span>
                        )}
                        {(signal.low_intent_noise?.low_intent_phrase_overridden || s?.low_intent_noise?.low_intent_phrase_overridden) && (
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                Preserved: {signal.low_intent_noise?.override_reason || s?.low_intent_noise?.override_reason}
                            </span>
                        )}

                        {/* S13-T08 Commercial/Personal Intent Badges */}
                        {(s?.classification?.context_tags?.includes('multi_signal_exploration_boost') || signal.context_tags?.includes('multi_signal_exploration_boost') ||
                          s?.classification?.context_tags?.includes('commercial_intent_multi_signal_boost') || signal.context_tags?.includes('commercial_intent_multi_signal_boost')) && (
                            <span className="px-2 py-0.5 bg-amber-500/15 text-amber-300 border border-amber-500/35 rounded text-[10px] font-black uppercase tracking-wider backdrop-blur-md animate-pulse">
                                Multi-Signal Boost
                            </span>
                        )}
                        {!(s?.classification?.context_tags?.includes('multi_signal_exploration_boost') || signal.context_tags?.includes('multi_signal_exploration_boost') ||
                           s?.classification?.context_tags?.includes('commercial_intent_multi_signal_boost') || signal.context_tags?.includes('commercial_intent_multi_signal_boost')) && 
                         (s?.classification?.context_tags?.includes('personal_exploration_candidate') || signal.context_tags?.includes('personal_exploration_candidate') ||
                          s?.classification?.context_tags?.includes('help_seeking_candidate') || signal.context_tags?.includes('help_seeking_candidate') ||
                          s?.classification?.context_tags?.includes('commercial_intent_candidate') || signal.context_tags?.includes('commercial_intent_candidate')) && (
                            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/30 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                                Personal Exploration
                            </span>
                        )}
                        {(s?.classification?.context_tags?.includes('commercial_seller_suppressed') || signal.context_tags?.includes('commercial_seller_suppressed') ||
                          s?.classification?.context_tags?.includes('creator_marketing_candidate') || signal.context_tags?.includes('creator_marketing_candidate') ||
                          s?.classification?.context_tags?.includes('creator_candidate') || signal.context_tags?.includes('creator_candidate') ||
                          s?.classification?.context_tags?.includes('seller_candidate') || signal.context_tags?.includes('seller_candidate') ||
                          s?.classification?.context_tags?.includes('outbound_marketing_candidate') || signal.context_tags?.includes('outbound_marketing_candidate') ||
                          s?.classification?.context_tags?.includes('audience_builder_candidate') || signal.context_tags?.includes('audience_builder_candidate') ||
                          s?.classification?.context_tags?.includes('coaching_promotion_candidate') || signal.context_tags?.includes('coaching_promotion_candidate')) && (
                            <span className="px-2 py-0.5 bg-slate-950/60 text-slate-500 border border-slate-800/80 rounded text-[10px] font-bold uppercase tracking-wider line-through opacity-65">
                                Suppressed Creator
                            </span>
                        )}

                        <span className="text-slate-500 font-mono text-[10px]" title="Signal ID">{signal.signal_id}</span>
                        <div className="h-1 w-1 rounded-full bg-slate-700" />
                        <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider" title={`Original classification: ${s?.classification.primary_category}`}>
                            {mapCategoryLabel(s?.classification.primary_category || 'UNCLASSIFIED')}
                        </span>
                    </div>

                    <p className={`text-lg transition-colors capitalize mb-4 ${
                        s?.priority_tier === 'HIGH' ? 'text-white font-semibold' : 
                        s?.priority_tier === 'MEDIUM' ? 'text-slate-100 font-medium' : 'text-slate-400 font-normal italic'
                    }`}>
                        {s?.raw_text}
                    </p>

                    <div className="flex gap-4 items-center">
                        <div className="flex items-center gap-2">
                            {isSourceUnknown ? (
                                <div className="flex items-center gap-1.5 px-3 py-1 bg-red-900/10 border border-red-500/20 rounded-lg text-red-500/70 text-[10px] font-bold uppercase italic">
                                    <AlertTriangle className="w-3 h-3" />
                                    Source Unavailable
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700/50 px-2 py-1 rounded-lg">
                                        <ExternalSourceIcon platform={s?.source?.platform || ''} className="w-3 h-3 text-cyan-400" />
                                        <span className="text-cyan-400 text-[9px] font-bold uppercase tracking-tight">
                                            {s?.source?.platform}
                                        </span>
                                    </div>
                                    <span className={`text-[10px] font-medium italic ${!checkIdentityMatch(s?.source?.source_url, s?.source?.username) ? 'text-amber-400' : 'text-slate-400'}`}>
                                        @{s?.source?.username}
                                    </span>
                                    {!checkIdentityMatch(s?.source?.source_url, s?.source?.username) && (
                                        <div className="px-1.5 py-0.5 bg-amber-500/10 border border-amber-500/20 rounded text-[8px] font-bold text-amber-500 uppercase animate-pulse">
                                            Mismatch
                                        </div>
                                    )}
                                    <div className="w-1 h-1 rounded-full bg-slate-700 mx-1" />
                                    <SourceLinkButton url={s?.source?.source_url} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className="text-[10px] text-slate-500 font-mono flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date().toLocaleTimeString()}
                    </div>
                    <div className="flex items-center gap-1.5 bg-slate-900/50 px-3 py-1.5 rounded-xl border border-slate-700/50">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Score</span>
                        <span className={`text-sm font-mono font-black ${s?.priority_tier === 'HIGH' ? 'text-cyan-400' : 'text-slate-400'}`}>
                            {s?.signal_score?.score || 0}
                        </span>
                    </div>
                    <div className="text-[9px] text-slate-600 font-bold uppercase tracking-widest text-right mt-1">
                        Queue: {s?.governance_route.queue === 'demo_synthetic_queue' ? 'DEMO/SYNTHETIC QUEUE' : s?.governance_route.queue.replace(/_/g, ' ')}
                    </div>
                </div>
            </div>
        </div>
    );
};

const MetricCard = ({ icon, label, value, color, bg }: { icon: React.ReactNode, label: string, value: number, color: string, bg: string }) => (
    <div className={`p-6 rounded-3xl border ${color} ${bg} backdrop-blur-sm transition-all hover:scale-[1.02]`}>
        <div className="flex justify-between items-start mb-4">
            <div className="p-2 rounded-xl bg-slate-900/50">
                {icon}
            </div>
            <span className="text-3xl font-mono font-bold text-white">{value}</span>
        </div>
        <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest">{label}</p>
    </div>
);

// End of file
