import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Users, Play, Square, Copy, Check, ArrowLeft, Send, MessageSquare, Radio, Award, Trophy, Sparkles, Brain, UserCheck, Clock, ShieldAlert, AlertTriangle, LogOut } from 'lucide-react';
import { getDebateByCodeApi, startDebateApi, analyzeDebateApi, toggleReadyApi, quitDebateApi } from '../services/debateService';
import { submitArgumentApi, getArgumentsApi, getDebateResultsApi } from '../services/argumentService';
import { useAuth } from '../context/AuthContext';
import socket from '../services/socket';
import Alert from '../components/common/Alert';
import LoadingSpinner from '../components/common/LoadingSpinner';

const DebateRoom = () => {
  const { roomCode } = useParams();
  const { user } = useAuth();

  const [debate, setDebate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [ending, setEnding] = useState(false);
  const [quitting, setQuitting] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [togglingReady, setTogglingReady] = useState(false);
  const [copied, setCopied] = useState(false);

  // Phase 9 Turn & Timer states
  const [turnInfo, setTurnInfo] = useState(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [countdown, setCountdown] = useState(null);
  const [submittedThisTurn, setSubmittedThisTurn] = useState(false);

  // Phase 3 Chat states
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineCount, setOnlineCount] = useState(1);
  const chatBottomRef = useRef(null);

  // Arguments & Results states
  const [argumentsList, setArgumentsList] = useState([]);
  const [newArgumentText, setNewArgumentText] = useState('');
  const [submittingArg, setSubmittingArg] = useState(false);
  const [results, setResults] = useState(null);

  // Phase 5 AI Analysis states
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [generatingAi, setGeneratingAi] = useState(false);

  // 1. Fetch initial debate details & arguments
  const fetchDebateData = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getDebateByCodeApi(roomCode);
      if (data.success) {
        setDebate(data.debate);
        if (data.debate.aiAnalysis) {
          setAiAnalysis(data.debate.aiAnalysis);
        }

        if (data.debate.status === 'active' || data.debate.status === 'completed') {
          const argData = await getArgumentsApi(roomCode);
          if (argData.success) {
            setArgumentsList(argData.arguments || []);
          }
        }

        if (data.debate.status === 'completed') {
          const resData = await getDebateResultsApi(roomCode);
          if (resData.success) {
            setResults(resData);
            if (resData.aiAnalysis) setAiAnalysis(resData.aiAnalysis);
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load debate room');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (roomCode) {
      fetchDebateData();
    }
  }, [roomCode]);

  // 2. Setup Socket.io connection & event listeners
  useEffect(() => {
    if (!roomCode || !user) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.emit('joinRoom', {
      roomCode,
      userName: user.name,
    });

    const handleReceiveMessage = (msgData) => {
      setMessages((prev) => [...prev, msgData]);
    };

    const handleUpdateParticipants = (data) => {
      if (data && typeof data.onlineCount === 'number') {
        setOnlineCount(data.onlineCount);
      }
    };

    const handleNewArgument = (newArg) => {
      setArgumentsList((prev) => {
        if (prev.some((a) => a._id === newArg._id)) return prev;
        return [...prev, newArg];
      });
    };

    const handleDebateEnded = (endedDebate) => {
      setDebate(endedDebate);
      setTurnInfo(null);
      getDebateResultsApi(roomCode).then((resData) => {
        if (resData.success) setResults(resData);
      });
    };

    const handleReadyStatusUpdated = (updatedDebate) => {
      setDebate(updatedDebate);
    };

    const handleRoomStateUpdated = (updatedDebate) => {
      setDebate(updatedDebate);
    };

    const handleDebateCountdown = (data) => {
      if (data && data.count !== undefined) {
        setCountdown(data.count);
      }
    };

    const handleTurnStarted = (data) => {
      setTurnInfo(data);
      setTimeLeft(data.duration || 20);
      setSubmittedThisTurn(false);
      setNewArgumentText('');
    };

    const handleTimerTick = (data) => {
      if (data && typeof data.timeLeft === 'number') {
        setTimeLeft(data.timeLeft);
      }
    };

    const handleTurnEnded = () => {
      setSubmittedThisTurn(false);
      setNewArgumentText('');
    };

    const handlePlayerQuit = (data) => {
      if (data && data.debate) {
        setDebate(data.debate);
        setTurnInfo(null);
      }
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('updateParticipants', handleUpdateParticipants);
    socket.on('newArgument', handleNewArgument);
    socket.on('debateEnded', handleDebateEnded);
    socket.on('readyStatusUpdated', handleReadyStatusUpdated);
    socket.on('roomStateUpdated', handleRoomStateUpdated);
    socket.on('debateCountdown', handleDebateCountdown);
    socket.on('turnStarted', handleTurnStarted);
    socket.on('timerTick', handleTimerTick);
    socket.on('turnEnded', handleTurnEnded);
    socket.on('playerQuit', handlePlayerQuit);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('updateParticipants', handleUpdateParticipants);
      socket.off('newArgument', handleNewArgument);
      socket.off('debateEnded', handleDebateEnded);
      socket.off('readyStatusUpdated', handleReadyStatusUpdated);
      socket.off('roomStateUpdated', handleRoomStateUpdated);
      socket.off('debateCountdown', handleDebateCountdown);
      socket.off('turnStarted', handleTurnStarted);
      socket.off('timerTick', handleTimerTick);
      socket.off('turnEnded', handleTurnEnded);
      socket.off('playerQuit', handlePlayerQuit);
      socket.disconnect();
    };
  }, [roomCode, user]);

  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Handle chat submission
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    socket.emit('sendMessage', {
      roomCode,
      user: user.name,
      message: newMessage.trim(),
      time: currentTime,
    });

    setNewMessage('');
  };

  // Block Paste / Drop / Context Menu
  const handleBlockPaste = (e) => {
    e.preventDefault();
    setError('Copy & pasting is disabled! Arguments must be typed live during your turn.');
    setTimeout(() => setError(''), 3500);
  };

  const handleKeyDownInput = (e) => {
    if ((e.ctrlKey || e.metaKey) && (e.key === 'v' || e.key === 'V')) {
      e.preventDefault();
      setError('Keyboard paste shortcut is disabled!');
      setTimeout(() => setError(''), 3500);
    }
  };

  // Handle argument submission during turn
  const handleSubmitArgument = async (e) => {
    e.preventDefault();
    if (!newArgumentText.trim() || submittedThisTurn) return;

    try {
      setSubmittingArg(true);
      setError('');
      const res = await submitArgumentApi(roomCode, newArgumentText.trim());
      if (res.success && res.argument) {
        setSubmittedThisTurn(true);
        setArgumentsList((prev) => [...prev, res.argument]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error submitting argument');
    } finally {
      setSubmittingArg(false);
    }
  };

  // Debater clicks "I'm Ready"
  const handleToggleReady = async () => {
    try {
      setTogglingReady(true);
      setError('');
      const res = await toggleReadyApi(roomCode);
      if (res.success && res.debate) {
        setDebate(res.debate);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error setting ready status');
    } finally {
      setTogglingReady(false);
    }
  };

  // Debaters click "Start Debate"
  const handleStartDebate = async () => {
    try {
      setStarting(true);
      setError('');
      const res = await startDebateApi(roomCode);
      if (res.success && res.debate) {
        setDebate(res.debate);
        socket.emit('startDebateCountdown', { roomCode });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Both debaters must click "I\'m Ready" first');
    } finally {
      setStarting(false);
    }
  };

  // Debater quits debate
  const handleConfirmQuit = async () => {
    try {
      setQuitting(true);
      setError('');
      const res = await quitDebateApi(roomCode);
      if (res.success && res.debate) {
        setDebate(res.debate);
        setShowQuitConfirm(false);
        setTurnInfo(null);
        const resData = await getDebateResultsApi(roomCode);
        if (resData.success) setResults(resData);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Error quitting debate');
    } finally {
      setQuitting(false);
    }
  };

  // Generate AI Analysis
  const handleGenerateAiAnalysis = async () => {
    try {
      setGeneratingAi(true);
      setError('');
      const res = await analyzeDebateApi(roomCode);
      if (res.success && res.aiAnalysis) {
        setAiAnalysis(res.aiAnalysis);
      } else {
        setError(res.message || 'Unable to generate AI analysis. Please try again.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 'Unable to generate AI analysis. Please try again.'
      );
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return <LoadingSpinner text="Loading debate room details..." />;
  }

  if (error && !debate) {
    return (
      <div className="container" style={{ padding: '3rem 1.5rem', maxWidth: '600px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
          <Alert type="danger" message={error} />
          <Link to="/debates" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
            <ArrowLeft size={16} /> Return to Debate List
          </Link>
        </div>
      </div>
    );
  }

  const debaters = debate?.debaters || [];
  const player1 = debaters[0];
  const player2 = debaters[1];

  const isPlayer1 = user && player1 && (user._id === player1._id || user._id === player1);
  const isPlayer2 = user && player2 && (user._id === player2._id || user._id === player2);
  const isDebater = isPlayer1 || isPlayer2;
  const isAudience = !isDebater;

  const isPlayer1Ready = debate?.player1Ready;
  const isPlayer2Ready = debate?.player2Ready;
  const bothPlayersReady = isPlayer1Ready && isPlayer2Ready && debaters.length === 2;

  const isDebateActive = debate?.status === 'active';
  const isDebateCompleted = debate?.status === 'completed';

  // Current turn checks
  const currentTurnDebaterId = turnInfo?.currentDebaterId || (debaters[debate?.currentTurnIndex || 0]?._id);
  const isMyTurn = isDebater && user && currentTurnDebaterId && user._id === currentTurnDebaterId;
  const currentDebaterName = turnInfo?.currentDebaterName || debaters[debate?.currentTurnIndex || 0]?.name || 'Debater';

  return (
    <div className="container" style={{ padding: '2.5rem 1.5rem' }}>

      {/* 3-2-1 Countdown Overlay */}
      {countdown !== null && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(13, 17, 23, 0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: '5rem', fontWeight: 900, color: 'var(--accent-light)' }}>
            {countdown}
          </div>
          <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginTop: '1rem' }}>
            Prepare for Round 1!
          </div>
        </div>
      )}

      <div style={{ marginBottom: '1.25rem' }}>
        <Link to="/debates" className="btn btn-secondary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.85rem' }}>
          <ArrowLeft size={14} /> Back to Debate List
        </Link>
      </div>

      {error && <Alert type="danger" message={error} />}

      {/* COMPLETED DEBATE RESULTS & AI ANALYSIS PANEL */}
      {isDebateCompleted && results && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginBottom: '2rem' }}>
          <div
            className="card"
            style={{
              background: 'rgba(35, 134, 54, 0.1)',
              border: '1px solid rgba(35, 134, 54, 0.4)',
              padding: '2rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#4ade80' }}>
              <Trophy size={28} />
              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 800 }}>
                DEBATE COMPLETED
              </h2>
            </div>

            {results.winnerReason && (
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1rem', color: '#f87171', fontSize: '0.95rem' }}>
                Notice: {results.winnerReason}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Winner / Standings
                </div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#4ade80', marginTop: '0.25rem' }}>
                  {results.winnerNames && results.winnerNames.length > 0 ? results.winnerNames.join(', ') : 'No Winner Yet'}
                </div>
              </div>

              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                  Total Arguments
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                  {results.totalArguments || 0}
                </div>
              </div>
            </div>
          </div>

          {/* AI DEBATE ANALYSIS CARD */}
          <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', padding: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Brain size={24} color="var(--accent-light)" />
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700 }}>
                  AI DEBATE ANALYSIS (Google Gemini)
                </h3>
              </div>

              {!aiAnalysis && (
                <button onClick={handleGenerateAiAnalysis} className="btn btn-primary" disabled={generatingAi}>
                  {generatingAi ? <><div className="spinner" /> Generating AI analysis...</> : <><Sparkles size={16} /> Generate AI Analysis</>}
                </button>
              )}
            </div>

            {!aiAnalysis ? (
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                Click <strong>"Generate AI Analysis"</strong> to process arguments using Google Gemini API.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div style={{ background: 'var(--bg-primary)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--accent-light)', marginBottom: '0.5rem' }}>Summary:</h4>
                  <p style={{ color: 'var(--text-primary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{aiAnalysis.summary}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', alignItems: 'start' }}>
        
        {/* Left Section: Topic, Turn Header, Input & Arguments */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          
          {/* TOPIC HEADER CARD */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1rem' }}>
              <div>
                <span className={`badge ${isDebateActive ? 'badge-emerald' : ''}`} style={{ textTransform: 'capitalize', marginBottom: '0.5rem' }}>
                  Status: {debate.status}
                </span>
                <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {debate.topic}
                </h1>
              </div>

              {/* Room Code Badge */}
              <div style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', padding: '0.4rem 0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Code:</span>
                <strong style={{ fontSize: '1rem', letterSpacing: '1px', color: 'var(--accent-light)' }}>{debate.roomCode}</strong>
                <button onClick={handleCopyCode} style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  {copied ? <Check size={14} color="#238636" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1rem' }}>
              {debate.description}
            </p>

            <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Radio size={15} color="#238636" /> Online Viewers: <strong style={{ color: '#4ade80' }}>{onlineCount}</strong>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={15} /> Total Participants: <strong>{debate.participants?.length || 0}</strong>
              </div>
            </div>
          </div>

          {/* TWO DEBATERS MATCHMAKING & READY SECTION */}
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Users size={18} color="var(--accent-light)" /> Debaters
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '1rem', alignItems: 'center', marginBottom: '1.25rem' }}>
              {/* Player 1 Card */}
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: isPlayer1 ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Player 1 {isPlayer1 && '(You)'}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  {player1?.name || 'Waiting for Player 1...'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Score: <em style={{ color: 'var(--text-muted)' }}>Coming in Phase 10</em>
                </div>
                <div>
                  <span className={`badge ${isPlayer1Ready ? 'badge-emerald' : ''}`} style={{ fontSize: '0.75rem' }}>
                    {isPlayer1Ready ? '✓ Ready' : 'Not Ready'}
                  </span>
                </div>
              </div>

              {/* VS Divider */}
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-light)' }}>
                VS
              </div>

              {/* Player 2 Card */}
              <div style={{ background: 'var(--bg-primary)', padding: '1rem', borderRadius: 'var(--radius-md)', border: isPlayer2 ? '1px solid var(--accent-primary)' : '1px solid var(--border-color)', textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, marginBottom: '0.3rem' }}>
                  Player 2 {isPlayer2 && '(You)'}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.3rem' }}>
                  {player2?.name || 'Waiting for Player 2...'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Score: <em style={{ color: 'var(--text-muted)' }}>Coming in Phase 10</em>
                </div>
                <div>
                  <span className={`badge ${isPlayer2Ready ? 'badge-emerald' : ''}`} style={{ fontSize: '0.75rem' }}>
                    {isPlayer2Ready ? '✓ Ready' : 'Not Ready'}
                  </span>
                </div>
              </div>
            </div>

            {/* DEBATER CONTROLS (I'm Ready & Start Debate & Quit Debate) */}
            {isDebater && debate.status !== 'active' && debate.status !== 'completed' && (
              <div style={{ background: 'rgba(79, 70, 229, 0.1)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(79, 70, 229, 0.3)', display: 'flex', flexDirection: 'column', gap: '0.75rem', textAlign: 'center' }}>
                {((isPlayer1 && !isPlayer1Ready) || (isPlayer2 && !isPlayer2Ready)) && (
                  <button onClick={handleToggleReady} className="btn btn-primary btn-block" disabled={togglingReady}>
                    {togglingReady ? <div className="spinner" /> : <><UserCheck size={18} /> I'M READY</>}
                  </button>
                )}

                {bothPlayersReady && (
                  <button onClick={handleStartDebate} className="btn btn-primary btn-block" disabled={starting} style={{ background: '#238636', borderColor: '#238636' }}>
                    {starting ? <div className="spinner" /> : <><Play size={18} /> START DEBATE</>}
                  </button>
                )}

                {!bothPlayersReady && (isPlayer1Ready || isPlayer2Ready) && (
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Waiting for opponent to click <strong>"I'm Ready"</strong>...
                  </p>
                )}
              </div>
            )}

            {/* QUIT DEBATE BUTTON & CONFIRMATION */}
            {isDebater && isDebateActive && (
              <div style={{ marginTop: '0.5rem' }}>
                {!showQuitConfirm ? (
                  <button onClick={() => setShowQuitConfirm(true)} className="btn btn-secondary btn-block" style={{ color: '#f87171', borderColor: 'rgba(218, 54, 51, 0.4)' }}>
                    <LogOut size={16} /> Quit Debate
                  </button>
                ) : (
                  <div style={{ background: 'rgba(218, 54, 51, 0.15)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(218, 54, 51, 0.4)', textAlign: 'center' }}>
                    <p style={{ fontSize: '0.88rem', color: '#f87171', marginBottom: '0.75rem', fontWeight: 600 }}>
                      Are you sure you want to quit the debate? Your opponent will automatically win.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                      <button onClick={() => setShowQuitConfirm(false)} className="btn btn-secondary" style={{ padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                        Cancel
                      </button>
                      <button onClick={handleConfirmQuit} className="btn btn-primary" disabled={quitting} style={{ background: '#da3633', borderColor: '#da3633', padding: '0.35rem 0.85rem', fontSize: '0.85rem' }}>
                        {quitting ? <div className="spinner" /> : 'Confirm Quit'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PHASE 9: ACTIVE TURN TIMER & ARGUMENT INPUT PANEL */}
          {isDebateActive && (
            <div className="card" style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-color)' }}>
              
              {/* Round & Turn Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <span className="badge" style={{ fontSize: '0.8rem', background: 'rgba(79, 70, 229, 0.2)', color: 'var(--accent-light)' }}>
                    ROUND {turnInfo?.round || debate.currentRound || 1} / 5
                  </span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.3rem' }}>
                    CURRENT TURN: <span style={{ color: 'var(--accent-light)' }}>{currentDebaterName}</span>
                  </div>
                </div>

                {/* 20-Second Timer Badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: timeLeft <= 5 ? 'rgba(218, 54, 51, 0.2)' : 'rgba(35, 134, 54, 0.2)', border: `1px solid ${timeLeft <= 5 ? '#da3633' : '#238636'}`, padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)' }}>
                  <Clock size={20} color={timeLeft <= 5 ? '#f87171' : '#4ade80'} />
                  <div>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600 }}>TIME REMAINING</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: timeLeft <= 5 ? '#f87171' : '#4ade80' }}>
                      {timeLeft}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Player Input / Opponent Notice / Audience Notice */}
              {isMyTurn ? (
                <form onSubmit={handleSubmitArgument}>
                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <label className="form-label" style={{ fontWeight: 600, color: 'var(--accent-light)' }}>
                        Write your argument (Live Typing Only):
                      </label>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        <ShieldAlert size={12} style={{ display: 'inline', marginRight: '3px' }} /> Copy/Paste Blocked
                      </span>
                    </div>

                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Type your argument live... Copying & pasting is disabled."
                      value={newArgumentText}
                      onChange={(e) => setNewArgumentText(e.target.value)}
                      onPaste={handleBlockPaste}
                      onContextMenu={handleBlockPaste}
                      onDrop={handleBlockPaste}
                      onKeyDown={handleKeyDownInput}
                      disabled={submittedThisTurn || timeLeft === 0}
                      required
                    ></textarea>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingArg || submittedThisTurn || timeLeft === 0 || !newArgumentText.trim()}
                    >
                      {submittingArg ? <div className="spinner" /> : submittedThisTurn ? '✓ Argument Submitted' : 'Submit Argument'}
                    </button>

                    {submittedThisTurn && (
                      <span style={{ fontSize: '0.85rem', color: '#4ade80', fontWeight: 600 }}>
                        Argument submitted. Turn will advance when timer reaches 0.
                      </span>
                    )}
                  </div>
                </form>
              ) : isDebater ? (
                <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Clock size={20} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  Wait for your turn. <strong>{currentDebaterName}</strong> is currently presenting.
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'var(--bg-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Radio size={20} color="#238636" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'text-bottom' }} />
                  Watch the current argument. <strong>{currentDebaterName}</strong> is presenting live.
                </div>
              )}
            </div>
          )}

          {/* ARGUMENTS DISPLAY LIST */}
          <div className="card">
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Debate Arguments ({argumentsList.length})
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {argumentsList.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', padding: '1.5rem 0' }}>
                  No arguments submitted yet.
                </p>
              ) : (
                argumentsList.map((arg) => (
                  <div
                    key={arg._id}
                    style={{
                      padding: '1.1rem',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.6rem'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span className="badge" style={{ fontSize: '0.7rem' }}>
                          Round {arg.round || 1}
                        </span>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--accent-light)' }}>
                          {arg.user?.name || 'Participant'}
                        </strong>
                      </div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {new Date(arg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
                      "{arg.content}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Section: Real-Time Chat Box */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', height: '620px', padding: '1.25rem' }}>
          <div style={{ paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <MessageSquare size={18} color="var(--accent-light)" /> Real-Time Debate Chat
            </h3>
            <span className="badge" style={{ fontSize: '0.75rem' }}>
              {onlineCount} Online
            </span>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem 0.5rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem',
            }}
          >
            {messages.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: 'auto', marginBottom: 'auto' }}>
                No messages yet. Send a message to start the discussion!
              </div>
            ) : (
              messages.map((msg, index) => {
                if (msg.isSystem) {
                  return (
                    <div key={index} style={{ textAlign: 'center', margin: '0.35rem 0' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-primary)', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        {msg.message}
                      </span>
                    </div>
                  );
                }

                const isSelf = user && msg.user === user.name;

                return (
                  <div
                    key={index}
                    style={{
                      alignSelf: isSelf ? 'flex-end' : 'flex-start',
                      maxWidth: '82%',
                      background: isSelf ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                      color: '#ffffff',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: isSelf ? 'none' : '1px solid var(--border-color)',
                      fontSize: '0.9rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', fontSize: '0.75rem', color: isSelf ? '#e0e7ff' : 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                      <strong>{isSelf ? 'You' : msg.user}</strong>
                      <span>{msg.time}</span>
                    </div>
                    <p style={{ wordBreak: 'break-word', lineHeight: '1.4' }}>{msg.message}</p>
                  </div>
                );
              })
            )}
            <div ref={chatBottomRef} />
          </div>

          <form onSubmit={handleSendMessage} style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <input
              type="text"
              className="form-control"
              placeholder="Type your comment..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1rem' }}>
              <Send size={16} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default DebateRoom;
