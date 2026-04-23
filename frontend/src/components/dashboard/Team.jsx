import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../utils/api';
import { 
  Users, Send, Sparkles, UserPlus, X, Check, 
  MessageSquare, UserCheck, ShieldAlert, ArrowLeft, RefreshCw, Hash, Plus 
} from 'lucide-react';




export default function Team({ user, onBack }) {
  const navigate = useNavigate();

  // Enforce locked screen if user is on Starter plan
  if (user?.plan === 'Starter') {
    return (
      <div className="min-h-[500px] flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[32px] p-8 text-center shadow-xl space-y-6 relative overflow-hidden">
          <div className="absolute -top-12 -right-12 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl" />
          <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl" />
          
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center mx-auto border border-orange-500/20 shadow-inner">
            <Users size={32} className="animate-pulse" />
          </div>

          <div className="space-y-2">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block">Premium Feature</span>
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-50 leading-tight">Team Connect Collaboration</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-bold leading-relaxed max-w-sm mx-auto">
              Real-time collaboration is restricted. Chat with coworkers, create channels, manage files, and coordinate tasks instantly.
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/50 border border-[#e8ecf4] dark:border-zinc-900 p-4 rounded-2xl text-left space-y-2.5">
            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-wider">Unlocks with Premium Plan:</p>
            <ul className="text-xs font-semibold text-zinc-600 dark:text-zinc-300 space-y-2">
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Unlimited team channels & chats</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Send direct messages to any contact</span>
              </li>
              <li className="flex items-center gap-2">
                <Check size={14} className="text-emerald-500 shrink-0" />
                <span>Synchronized dashboard sharing & co-working</span>
              </li>
            </ul>
          </div>

          <div className="flex gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex-1 py-3 border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-900 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
              >
                Back to Dashboard
              </button>
            )}
            <button
              type="button"
              onClick={() => navigate('/dashboard/settings', { state: { activeTab: 'billing' } })}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:opacity-95 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-orange-500/20 cursor-pointer text-center"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- Load States ---
  const [members, setMembers] = useState([]);
  const [activeChats, setActiveChats] = useState([]);
  const [pendingIncoming, setPendingIncoming] = useState([]);
  const [pendingOutgoing, setPendingOutgoing] = useState([]);
  const [inviteError, setInviteError] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState('');

  const [privateMessages, setPrivateMessages] = useState({});
  const [activeRoomId, setActiveRoomId] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch chat requests and active chats from backend
  const loadRequestsAndChats = async () => {
    try {
      const [activeChatsData, invitesData] = await Promise.all([
        api.get('/team/active-chats'),
        api.get('/team/invites/pending')
      ]);

      const normActiveChats = activeChatsData.map(c => ({
        id: c.id,
        name: c.name,
        email: c.email,
        role: 'Teammate / Active Contact',
        online: c.online,
        color: c.color || 'bg-indigo-500',
        avatarUrl: c.avatarUrl,
        isReal: true
      }));

      setActiveChats(normActiveChats);
      setPendingIncoming(invitesData.incoming || []);
      setPendingOutgoing(invitesData.outgoing || []);
      return normActiveChats;
    } catch (err) {
      console.error("Failed to load requests and active chats", err);
      return [];
    }
  };

  // Fetch team details from MongoDB on mount
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true);
        const membersData = await api.get('/team/members');
        const privateMsgsData = await api.get('/team/private-messages');

        const normActiveChats = await loadRequestsAndChats();

        const normMembers = membersData.map(m => ({
          id: m._id,
          name: m.name,
          email: m.email,
          role: m.role,
          online: m.online,
          color: m.color
        }));

        const groupedPrivateMsgs = {};
        normMembers.forEach(m => {
          groupedPrivateMsgs[m.id] = [];
        });
        normActiveChats.forEach(c => {
          groupedPrivateMsgs[c.id] = [];
        });

        privateMsgsData.forEach(msg => {
          const senderIdStr = String(msg.senderId);
          const receiverIdStr = String(msg.receiverId);
          const currentUserIdStr = String(user?.id || user?._id);

          const partnerId = senderIdStr === currentUserIdStr ? receiverIdStr : senderIdStr;

          if (!groupedPrivateMsgs[partnerId]) {
            groupedPrivateMsgs[partnerId] = [];
          }
          groupedPrivateMsgs[partnerId].push({
            id: msg._id,
            senderName: msg.senderName,
            senderId: msg.senderId,
            text: msg.text,
            time: msg.time,
            isMe: senderIdStr === currentUserIdStr
          });
        });

        setMembers(normMembers);
        setPrivateMessages(groupedPrivateMsgs);

        // Set initial active room to first active chat partner, or requests tab
        if (normActiveChats.length > 0) {
          setActiveRoomId(normActiveChats[0].id);
        } else {
          setActiveRoomId('requests-tab');
        }
      } catch (err) {
        console.error("Failed to load team data from database", err);
      } finally {
        setLoading(false);
      }
    };
    if (user) {
      loadTeamData();
    }
  }, [user]);

  // Periodic Polling for Chat updates
  useEffect(() => {
    if (!user) return;
    
    const pollInterval = setInterval(async () => {
      try {
        const [privateMsgsData, activeChatsData, invitesData] = await Promise.all([
          api.get('/team/private-messages'),
          api.get('/team/active-chats'),
          api.get('/team/invites/pending')
        ]);

        const normActiveChats = activeChatsData.map(c => ({
          id: c.id,
          name: c.name,
          email: c.email,
          role: 'Teammate / Active Contact',
          online: c.online,
          color: c.color || 'bg-indigo-500',
          avatarUrl: c.avatarUrl,
          isReal: true
        }));

        setActiveChats(normActiveChats);
        setPendingIncoming(invitesData.incoming || []);
        setPendingOutgoing(invitesData.outgoing || []);

        const groupedPrivateMsgs = {};
        members.forEach(m => {
          groupedPrivateMsgs[m.id] = [];
        });
        normActiveChats.forEach(c => {
          groupedPrivateMsgs[c.id] = [];
        });

        privateMsgsData.forEach(msg => {
          const senderIdStr = String(msg.senderId);
          const receiverIdStr = String(msg.receiverId);
          const currentUserIdStr = String(user?.id || user?._id);

          const partnerId = senderIdStr === currentUserIdStr ? receiverIdStr : senderIdStr;

          if (!groupedPrivateMsgs[partnerId]) {
            groupedPrivateMsgs[partnerId] = [];
          }
          groupedPrivateMsgs[partnerId].push({
            id: msg._id,
            senderName: msg.senderName,
            senderId: msg.senderId,
            text: msg.text,
            time: msg.time,
            isMe: senderIdStr === currentUserIdStr
          });
        });

        setPrivateMessages(groupedPrivateMsgs);
      } catch (err) {
        console.error("Failed to poll chat updates", err);
      }
    }, 5000);

    return () => clearInterval(pollInterval);
  }, [user, members]);

  // --- UI States ---
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('Member');

  const [channelModalOpen, setChannelModalOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelDesc, setNewChannelDesc] = useState('');

  const [chatInput, setChatInput] = useState('');
  const [typingUser, setTypingUser] = useState('');

  // --- Scroll Ref ---
  const chatBottomRef = useRef(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [privateMessages, activeRoomId, typingUser]);

  // --- Invite Member / Send Chat request ---
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberEmail.trim()) return;

    setInviteError('');
    setInviteSuccess('');

    try {
      const payload = { email: newMemberEmail.trim() };

      const res = await api.post('/team/invites', payload);
      setInviteSuccess(res.message || 'Chat invitation sent successfully!');
      
      await loadRequestsAndChats();
      
      setNewMemberEmail('');
      setNewMemberName('');
      setTimeout(() => {
        setInviteSuccess('');
        setInviteModalOpen(false);
      }, 2000);
    } catch (err) {
      setInviteError(err.message || 'Failed to send invite.');
    }
  };

  const handleAcceptInvite = async (requestId) => {
    try {
      await api.put(`/team/invites/${requestId}`, { action: 'accept' });
      const updatedChats = await loadRequestsAndChats();
      setPrivateMessages(prev => {
        const copy = { ...prev };
        updatedChats.forEach(c => {
          if (!copy[c.id]) {
            copy[c.id] = [];
          }
        });
        return copy;
      });
      const acceptedReq = pendingIncoming.find(req => req._id === requestId);
      if (acceptedReq) {
        setActiveRoomId(acceptedReq.senderId._id);
      }
    } catch (err) {
      console.error("Failed to accept invite", err);
    }
  };

  const handleDeclineInvite = async (requestId) => {
    try {
      await api.put(`/team/invites/${requestId}`, { action: 'decline' });
      await loadRequestsAndChats();
    } catch (err) {
      console.error("Failed to decline invite", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const text = chatInput.trim();
    setChatInput('');

    try {
      const created = await api.post('/team/private-messages', {
        receiverId: activeRoomId,
        senderName: 'You',
        senderId: 'current-user',
        text
      });
      const userPrivateMessage = {
        id: created._id,
        senderName: created.senderName,
        senderId: created.senderId,
        text: created.text,
        time: created.time,
        isMe: true
      };
      setPrivateMessages(prev => ({
        ...prev,
        [activeRoomId]: [...(prev[activeRoomId] || []), userPrivateMessage]
      }));
    } catch (err) {
      console.error("Failed to send message", err);
    }
  };

  // --- Get Initials Helper ---
  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  // --- Current Active Room Messages & Details ---
  const currentMessages = useMemo(() => {
    return privateMessages[activeRoomId] || [];
  }, [activeRoomId, privateMessages]);

  const activeRoomTitle = useMemo(() => {
    if (activeRoomId === 'requests-tab') return 'Chat Invitations';
    const targetMember = members.find(m => m.id === activeRoomId) || activeChats.find(c => c.id === activeRoomId);
    return targetMember ? `Private Chat with ${targetMember.name}` : 'Private Chat';
  }, [activeRoomId, members, activeChats]);



  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-zinc-400 font-sans">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="animate-spin text-orange-500" size={32} />
          <p className="text-xs font-bold tracking-wider uppercase text-zinc-500">Syncing Team Connect...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header controls */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800/80 pb-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 border border-zinc-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 text-zinc-650 dark:text-zinc-350 rounded-xl transition-all cursor-pointer"
            >
              <ArrowLeft size={16} />
            </button>
          )}
          <div className="text-left">
            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">Collaboration Suite</span>
            <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 leading-tight">Team Connect Hub</h2>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-black text-orange-500 uppercase tracking-wider bg-orange-500/10 px-3 py-1.5 rounded-full border border-orange-500/20">
          <MessageSquare size={12} className="animate-pulse" />
          <span>RTC Signaling Online</span>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Column: Chat Room Panel */}
        <div className="lg:col-span-8 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-[24px] overflow-hidden flex flex-col justify-between min-h-[500px] shadow-2xs">
          
          {/* Room Header */}
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20 flex justify-between items-center text-left">
            <div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-wider block">
                {activeRoomId === 'requests-tab' ? 'System Directory' : 'Direct Message'}
              </span>
              <h3 className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase truncate max-w-sm">
                {activeRoomTitle}
              </h3>
            </div>
            
            {activeRoomId === 'requests-tab' ? (
              <div className="flex items-center gap-1.5">
                <UserCheck size={14} className="text-orange-500" />
                <span className="text-[9px] font-black text-orange-500 uppercase">Incoming & Outgoing</span>
              </div>
            ) : (
              (() => {
                const isReal = activeChats.some(c => c.id === activeRoomId);
                return (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${isReal ? 'bg-indigo-500' : 'bg-emerald-500'} animate-pulse`} />
                      <span className={`text-[9px] font-black ${isReal ? 'text-indigo-500' : 'text-emerald-500'} uppercase`}>
                        {isReal ? 'Real Teammate' : 'Teammate Online'}
                      </span>
                    </div>
                    <button
                      onClick={() => setInviteModalOpen(true)}
                      className="p-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[9px] font-black uppercase tracking-wider"
                      title="Invite Teammate to Workspace"
                    >
                      <UserPlus size={10} />
                      <span>Invite</span>
                    </button>
                  </div>
                );
              })()
            )}
          </div>

          {activeRoomId === 'requests-tab' ? (
            /* Requests Dashboard */
            <div className="flex-1 flex flex-col justify-start p-5 text-left space-y-6 overflow-y-auto max-h-[420px]">
              
              {/* Incoming Requests Section */}
              <div className="space-y-3">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <UserCheck size={13} className="text-emerald-500" />
                  <span>Incoming Chat Invitations</span>
                  {pendingIncoming.length > 0 && (
                    <span className="text-[8px] font-black bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                      {pendingIncoming.length}
                    </span>
                  )}
                </h4>
                
                {pendingIncoming.length === 0 ? (
                  <div className="p-5 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl text-center text-zinc-400 dark:text-zinc-550 italic text-[11px]">
                    No pending incoming chat requests.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pendingIncoming.map((req) => (
                      <div 
                        key={req._id}
                        className="bg-slate-50 dark:bg-zinc-900/40 border border-slate-100 dark:border-zinc-850/50 p-3 rounded-2xl flex items-center justify-between shadow-3xs"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {getInitials(req.senderId.name)}
                          </div>
                          <div className="min-w-0 leading-tight">
                            <h5 className="font-extrabold text-xs text-zinc-850 dark:text-zinc-100 truncate">{req.senderId.name}</h5>
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{req.senderId.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          <button
                            onClick={() => handleAcceptInvite(req._id)}
                            className="p-1.5 bg-emerald-500 text-white hover:bg-emerald-600 rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-500/20"
                            title="Accept Chat Invite"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => handleDeclineInvite(req._id)}
                            className="p-1.5 bg-red-500 text-white hover:bg-red-650 rounded-xl transition-all cursor-pointer shadow-md shadow-red-500/20"
                            title="Decline Chat Invite"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Outgoing Requests Section */}
              <div className="space-y-3 pt-4 border-t border-zinc-100 dark:border-zinc-900/50">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-700 dark:text-zinc-300 flex items-center gap-2">
                  <Send size={13} className="text-indigo-500" />
                  <span>Sent Invitations</span>
                </h4>
                
                {pendingOutgoing.length === 0 ? (
                  <div className="p-5 border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl text-center text-zinc-400 dark:text-zinc-550 italic text-[11px]">
                    No pending sent invitations.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {pendingOutgoing.map((req) => (
                      <div 
                        key={req._id}
                        className="bg-slate-50/50 dark:bg-zinc-900/25 border border-slate-105 dark:border-zinc-850/30 p-3 rounded-2xl flex items-center justify-between shadow-3xs opacity-80"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-8 h-8 rounded-xl bg-zinc-700 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {getInitials(req.receiverId.name)}
                          </div>
                          <div className="min-w-0 leading-tight">
                            <h5 className="font-extrabold text-xs text-zinc-850 dark:text-zinc-100 truncate">{req.receiverId.name}</h5>
                            <p className="text-[9px] text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{req.receiverId.email}</p>
                          </div>
                        </div>
                        
                        <span className="text-[8px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full shrink-0">
                          Pending
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <>
              {/* Chat Stream Messages */}
              <div className="flex-1 p-5 space-y-4 overflow-y-auto max-h-[360px] text-left">
                {currentMessages.length > 0 ? (
                  currentMessages.map((msg) => {
                    const matchedColleague = [...activeChats, ...members].find(m => m.name === msg.senderName || m.id === msg.senderId);
                    const avatarBg = matchedColleague?.color || 'bg-zinc-700';
                    return (
                      <div 
                        key={msg.id} 
                        className={`flex gap-3 max-w-[85%] ${msg.isMe ? 'ml-auto flex-row-reverse text-right' : 'mr-auto text-left'}`}
                      >
                        {/* Avatar Column */}
                        {msg.isMe ? (
                          user?.avatarUrl ? (
                            <img 
                              src={user.avatarUrl} 
                              alt="You"
                              className="w-8 h-8 rounded-xl object-cover shrink-0" 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-[10px] font-black text-white bg-orange-500">
                              {getInitials(user?.name || 'You')}
                            </div>
                          )
                        ) : (
                          matchedColleague?.avatarUrl ? (
                            <img 
                              src={matchedColleague.avatarUrl} 
                              alt={msg.senderName}
                              className="w-8 h-8 rounded-xl object-cover shrink-0" 
                            />
                          ) : (
                            <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-[10px] font-black text-white ${avatarBg}`}>
                              {getInitials(msg.senderName)}
                            </div>
                          )
                        )}

                        <div className={`flex flex-col space-y-1 ${msg.isMe ? 'items-end' : 'items-start'}`}>
                          <div className={`flex items-center gap-1.5 text-[9px] font-black text-zinc-500 dark:text-zinc-400 ${msg.isMe ? 'justify-end' : ''}`}>
                            <span>{msg.senderName}</span>
                            <span>•</span>
                            <span>{new Date(msg.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>

                          <div className={`p-3 rounded-2xl text-xs font-semibold leading-relaxed shadow-3xs w-fit text-left ${
                            msg.isMe 
                              ? 'bg-orange-500 text-white rounded-tr-none' 
                              : 'bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800/60 text-zinc-800 dark:text-zinc-200 rounded-tl-none'
                          }`}>
                            {msg.text}
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-20 flex flex-col items-center justify-center text-zinc-400 dark:text-zinc-550 italic text-[11px]">
                    <span>No messages recorded in this direct line. Start chatting!</span>
                  </div>
                )}

                {/* Typing Indicator */}
                {typingUser && (
                  <div className="flex gap-3 mr-auto items-center">
                    <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-[10px] font-black animate-pulse">
                      💬
                    </div>
                    <div className="text-[10px] text-zinc-400 font-bold flex items-center gap-1">
                      <RefreshCw size={10} className="animate-spin text-orange-500" />
                      <span>{typingUser} is typing...</span>
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Chat Sender Form */}
              <form 
                onSubmit={handleSendMessage}
                className="p-4 border-t border-zinc-100 dark:border-zinc-900 bg-slate-50/50 dark:bg-zinc-950/20 flex gap-3 items-center"
              >
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Send private message..."
                  className="flex-1 bg-white dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl px-4 py-2 text-xs font-semibold text-zinc-800 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all shadow-md shadow-orange-500/25 shrink-0 cursor-pointer flex items-center justify-center"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </div>

        {/* Right Column: Channels & Members Switcher */}
        <div className="lg:col-span-4 bg-white dark:bg-zinc-950 border border-zinc-200/60 dark:border-zinc-900 rounded-[24px] p-5 space-y-4 shadow-2xs flex flex-col justify-between text-left">
          
          <div className="space-y-4">
            
            {/* Header / Inviter action */}
            <div className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-900 pb-3">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">Teammate Hub</h3>
                <p className="text-[10px] text-zinc-400 font-bold mt-0.5">Teammate logs & chats</p>
              </div>
              
              <button
                onClick={() => setInviteModalOpen(true)}
                className="p-2 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-[10px] font-black uppercase tracking-wider animate-pulse hover:animate-none"
              >
                <UserPlus size={12} />
                <span>Invite</span>
              </button>
            </div>

            {/* Chat Requests Section */}
            <div className="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-900/50">
              <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-1">Connections</span>
              
              <button
                onClick={() => setActiveRoomId('requests-tab')}
                className={`w-full flex items-center justify-between p-2 rounded-2xl border transition-all text-[11px] text-left cursor-pointer font-bold ${
                  activeRoomId === 'requests-tab'
                    ? 'bg-orange-500 text-white border-transparent shadow-xs'
                    : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200'
                }`}
              >
                <div className="flex items-center gap-2">
                  <UserCheck size={14} className="shrink-0" />
                  <span>Chat Requests</span>
                </div>
                {pendingIncoming.length > 0 && (
                  <span className="bg-red-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
                    {pendingIncoming.length}
                  </span>
                )}
              </button>
            </div>

            {/* Direct Messages Section */}
            <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-900/50">
              <div className="flex justify-between items-center mb-1 pr-1">
                <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block">Direct Messages</span>
                <button 
                  onClick={() => setInviteModalOpen(true)}
                  className="text-zinc-400 hover:text-orange-500 transition-colors cursor-pointer"
                  title="Invite Teammate to Workspace"
                >
                  <UserPlus size={11} />
                </button>
              </div>
              
              <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                {activeChats.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setActiveRoomId(m.id)}
                    className={`w-full flex items-center justify-between p-1.5 rounded-2xl border transition-all text-left cursor-pointer ${
                      activeRoomId === m.id
                        ? 'bg-orange-500 text-white border-transparent shadow-xs'
                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-zinc-900/40 text-zinc-800 dark:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Initials Circle */}
                      <div className={`w-7.5 h-7.5 rounded-xl ${m.color} text-white flex items-center justify-center font-black text-[9px] shrink-0 border border-white/10`}>
                        {getInitials(m.name)}
                      </div>
                      <div className="min-w-0 leading-tight">
                        <h4 className={`text-xs font-extrabold truncate flex items-center gap-1.5 ${activeRoomId === m.id ? 'text-white' : 'text-zinc-800 dark:text-zinc-100'}`}>
                          <span>{m.name}</span>
                          {m.isReal && (
                            <span className={`text-[7px] font-black uppercase px-1 py-0.5 rounded-sm shrink-0 leading-none ${
                              activeRoomId === m.id ? 'bg-white/20 text-white' : 'bg-indigo-500/10 text-indigo-500'
                            }`}>
                              Real
                            </span>
                          )}
                        </h4>
                        <p className={`text-[9px] truncate mt-0.5 ${activeRoomId === m.id ? 'text-white/80' : 'text-zinc-450'}`}>
                          {m.role}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        activeRoomId === m.id ? 'bg-white' : m.isReal ? 'bg-indigo-500' : 'bg-emerald-500'
                      } ${m.online ? 'animate-pulse' : 'opacity-40'}`} />
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="bg-slate-50 dark:bg-zinc-900/35 border border-[#e8ecf4] dark:border-zinc-900 p-2.5 rounded-2xl text-[9px] font-bold text-zinc-400 leading-relaxed text-center">
            <span>Select a channel or teammate above to route chat traffic!</span>
          </div>

        </div>

      </div>

      {/* Invite Member Modal overlay */}
      {inviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6 relative text-left space-y-4 font-semibold text-xs">
            
            <button
              onClick={() => setInviteModalOpen(false)}
              className="absolute top-5 right-5 text-zinc-400 hover:text-zinc-650 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X size={16} />
            </button>

            <div>
              <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest block font-sans">Workspace Directory</span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-50 leading-tight">
                Invite New Member
              </h3>
            </div>
            
            {inviteError && (
              <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl text-[10px] flex items-center gap-2">
                <span>{inviteError}</span>
              </div>
            )}
            {inviteSuccess && (
              <div className="p-3 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 rounded-xl text-[10px] flex items-center gap-2 font-bold animate-pulse">
                <span>{inviteSuccess}</span>
              </div>
            )}

            <form onSubmit={handleInviteSubmit} className="space-y-4">

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase">Full Name (Optional for registered users)</label>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  placeholder="e.g. Gaurav Goswami"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase">Email Address *</label>
                <input
                  type="email"
                  required
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  placeholder="e.g. gaurav@domain.com"
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-zinc-500 uppercase">Role / Title *</label>
                <select
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-zinc-900 border border-[#e8ecf4] dark:border-zinc-800 rounded-xl px-3.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-orange-500 cursor-pointer"
                >
                  <option value="Admin / Senior Architect" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Admin / Senior Architect</option>
                  <option value="Billing Specialist" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Billing Specialist</option>
                  <option value="Operations Coordinator" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Operations Coordinator</option>
                  <option value="Developer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Developer</option>
                  <option value="Observer" className="text-zinc-800 dark:text-zinc-200 bg-white dark:bg-zinc-900">Observer</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setInviteModalOpen(false)}
                  className="px-4 py-2 border border-zinc-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-xl text-zinc-650 dark:text-zinc-350 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-black shadow-md cursor-pointer"
                >
                  Send Invitation
                </button>
              </div>

            </form>

          </div>
        </div>
      )}



    </div>
  );
}
