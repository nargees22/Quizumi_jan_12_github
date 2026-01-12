

import React, { useState, useMemo } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
//import { db } from '../firebase';
import type { Player, QuizConfig, Quiz } from '../types';
import { Clan } from '../types';
import { AVATARS } from '../../avatars';
import Card from '../components/Card';
import Button from '../components/Button';
import { supabase } from '../service/supabase';



const JoinQuizPage = () => {
    const { quizId: paramQuizId } = useParams<{ quizId: string }>();
    const location = useLocation();

    const quizIdFromUrl = useMemo(() => {
        const queryParams = new URLSearchParams(location.search);
        const quizCodeFromQuery = queryParams.get('quizCode');
        return quizCodeFromQuery || paramQuizId;
    }, [location.search, paramQuizId]);

    const [quizId, setQuizId] = useState(quizIdFromUrl || '');
    const [name, setName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isJoining, setIsJoining] = useState(false);
    const navigate = useNavigate();

    const [step, setStep] = useState<'join' | 'clan'>('join');
    const [allPlayers, setAllPlayers] = useState<Player[]>([]);
    const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null);
    const [quizDbId, setQuizDbId] = useState<string | null>(null);


    // const handleJoin = async (e: React.FormEvent) => {
    //     e.preventDefault();
    //     setError('');

    //     if (!quizId.trim() || !name.trim() || !selectedAvatar) {
    //         setError("Quiz code, nickname, and an avatar are required.");
    //         return;
    //     }

    //     setIsJoining(true);
    //     const upperQuizId = quizId.toUpperCase().trim();
    //     try {
    //         const quizRef = db.collection('quizzes').doc(upperQuizId);
    //         const docSnap = await quizRef.get();
    //         if (!docSnap.exists) {
    //             setError("Quiz not found. Please check the code.");
    //             setIsJoining(false);
    //             return;
    //         }
    //         const quizData = docSnap.data() as Quiz;
    //         setQuizConfig(quizData.config);

    //         if (quizData.config.clanBased) {
    //             const playersSnap = await db.collection('quizzes').doc(upperQuizId).collection('players').get();
    //             const allPlayersData = playersSnap.docs.map(doc => doc.data() as Player);
    //             setAllPlayers(allPlayersData);

    //             if (quizData.config.clanAssignment === 'autoBalance') {
    //                 const clanCounts = allPlayersData.reduce((acc, p) => {
    //                     if (p.clan) {
    //                         acc[p.clan] = (acc[p.clan] || 0) + 1;
    //                     }
    //                     return acc;
    //                 }, {} as Record<Clan, number>);

    //                 const titansCount = clanCounts[Clan.TITANS] || 0;
    //                 const defendersCount = clanCounts[Clan.DEFENDERS] || 0;

    //                 const assignedClan = titansCount <= defendersCount ? Clan.TITANS : Clan.DEFENDERS;
    //                 await handleClanSelectionAndJoin(assignedClan);
    //                 return;
    //             }


    //             setStep('clan');
    //             setIsJoining(false); // Ready for next user action
    //         } else {
    //             // Not clan-based, join directly
    //             const playerId = crypto.randomUUID();
    //             const player: Player = { 
    //                 id: playerId, 
    //                 name: name.trim(), 
    //                 score: 0, 
    //                 answers: [], 
    //                 avatar: selectedAvatar,
    //                 lifelines: { pointDoubler: 0 },
    //                 correctStreak: 0,
    //                 fiftyFiftyUses: 0,
    //             };

    //             const playerRef = db.collection('quizzes').doc(upperQuizId).collection('players').doc(playerId);
    //             await playerRef.set(player);

    //             localStorage.setItem(`quiz-player-${upperQuizId}`, playerId);
    //             navigate(`/player-lobby/${upperQuizId}`);
    //         }
    //     } catch (err) {
    //         console.error("Error verifying quiz code:", err);
    //         setError("Could not verify quiz. Please try again.");
    //         setIsJoining(false);
    //     }
    // };
    const handleJoin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!quizId.trim() || !name.trim() || !selectedAvatar) {
            setError('Quiz code, nickname, and avatar are required.');
            return;
        }

        setIsJoining(true);
        const upperQuizId = quizId.toUpperCase().trim();

        try {
            // 1️⃣ Verify quiz exists
            const { data: quiz, error: quizError } = await supabase
                .from('quiz_master_structure')
                .select(`quiz_id,
        clan_based,
        clan_assignment,
        titan_name,
        defender_name
      `)
                .eq('quiz_id', upperQuizId)
              // .eq('join_code', upperQuizId)
                .single();
                //.maybeSingle();

            // if (quizError || !quiz) {
            //     setError('Quiz not found.');
            //     console.log('Quiz fetch response:', quiz, quizError);

            //     setIsJoining(false);
            //     return;
            // }

            if (quizError) {
    console.error('Quiz fetch error:', quizError);
    setError('Failed to fetch quiz.');
    setIsJoining(false);
    return;
}
console.log('QUIZ RESULT:', quiz);
console.log('QUIZ ERROR:', quizError);

if (!quiz) {
    setError('Quiz not found.');
    setIsJoining(false);
    return;
}
setQuizDbId(quiz.quiz_id);


            setQuizConfig({
                clanBased: quiz.clan_based,
                clanAssignment: quiz.clan_assignment,

                showLiveResponseCount: false,
                showQuestionToPlayers: false,

                clanNames: {
                    [Clan.TITANS]: quiz.titan_name || 'Titans',
                    [Clan.DEFENDERS]: quiz.defender_name || 'Defenders',
                },
            });


            // 2️⃣ If clan-based → fetch players
            if (quiz.clan_based) {
                const { data: players } = await supabase
                    .from('quiz_players')
                    .select('*')
                    //.eq('quiz_id', upperQuizId);
                    .eq('quiz_id', quiz.quiz_id);

                setAllPlayers(players ?? []);

                // Auto-balance logic
                if (quiz.clan_assignment === 'autoBalance') {
                    const titanCount =
                        players?.filter(p => p.clan === Clan.TITANS).length ?? 0;
                    const defenderCount =
                        players?.filter(p => p.clan === Clan.DEFENDERS).length ?? 0;

                    const assignedClan =
                        titanCount <= defenderCount ? Clan.TITANS : Clan.DEFENDERS;

                    await joinPlayer(assignedClan);
                    return;
                }

                setStep('clan');
                setIsJoining(false);
                return;
            }

            // 3️⃣ Non-clan quiz → join directly
            await joinPlayer(null);
        } catch (err) {
            console.error(err);
            setError('Failed to join quiz.');
            setIsJoining(false);
        }
    };
    const joinPlayer = async (clan: Clan | null) => {
          if (!quizDbId) {
        setError('Quiz not loaded yet');
        setIsJoining(false);
        return;
    }
        if (!quizId || !name || !selectedAvatar) {
            setError('Missing details');
            setIsJoining(false);
            return;
        }

        const playerId = crypto.randomUUID();
        const upperQuizId = quizId.toUpperCase().trim();

        const { error } = await supabase
            .from('quiz_players')
            .insert({
            //    quiz_id: upperQuizId,
             quiz_id: quizDbId,
              
                player_id: playerId,
                player_name: name.trim(),
                avatar: selectedAvatar,
                clan,
                score: 0,
            });

        if (error) {
            console.error('Supabase join error:', error);
            setError('Failed to join quiz.');
            setIsJoining(false);
            return;
        }

       // localStorage.setItem(`quiz-player-${upperQuizId}`, playerId);
       localStorage.setItem(`quiz-player-${quizDbId}`, playerId);

     //   navigate(`/player-lobby/${upperQuizId}`);
     navigate(`/player-lobby/${quizDbId}`);

    };


    // const handleClanSelectionAndJoin = async (clan: Clan) => {
    //     if (!quizId || !name || !selectedAvatar) {
    //         setError("An unexpected error occurred. Please try again.");
    //         setStep('join');
    //         return;
    //     }
    //     setIsJoining(true);
    //     const upperQuizId = quizId.toUpperCase().trim();
    //     try {
    //         const playerId = crypto.randomUUID();
    //         const player: Player = { 
    //             id: playerId, 
    //             name: name.trim(), 
    //             score: 0, 
    //             answers: [], 
    //             avatar: selectedAvatar, 
    //             clan,
    //             lifelines: { pointDoubler: 0 },
    //             correctStreak: 0,
    //             fiftyFiftyUses: 0,
    //         };

    //         const playerRef = db.collection('quizzes').doc(upperQuizId).collection('players').doc(playerId);
    //         await playerRef.set(player);

    //         localStorage.setItem(`quiz-player-${upperQuizId}`, playerId);
    //         navigate(`/player-lobby/${upperQuizId}`);

    //     } catch (err) {
    //         console.error("Failed to join quiz:", err);
    //         setError("Could not join quiz. Please try again.");
    //         setIsJoining(false);
    //         setStep('join'); // Revert to form on error
    //     }
    // };

    const ClanSelection = () => {
        const clanColors: Record<Clan, string> = {
            [Clan.TITANS]: 'from-red-500 to-orange-500',
            [Clan.DEFENDERS]: 'from-blue-500 to-cyan-500',
        };
        const clanNames = quizConfig?.clanNames || { [Clan.TITANS]: 'Titans', [Clan.DEFENDERS]: 'Defenders' };

        const clanPlayerCounts = Object.values(Clan).reduce((acc, clanName) => {
            acc[clanName] = allPlayers.filter(p => p.clan === clanName).length;
            return acc;
        }, {} as Record<Clan, number>);

        return (
            <div className="animate-fade-in">
                <h2 className="text-2xl font-bold text-center mb-4">Choose Your Clan</h2>
                {error && <p className="text-red-500 text-sm text-center mb-2">{error}</p>}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {Object.values(Clan).map(clan => (
                        <button key={clan} onClick={() => joinPlayer(clan)}
                            disabled={isJoining}
                            className={`p-6 rounded-lg text-white font-bold text-xl transition transform hover:scale-105 shadow-lg flex flex-col items-center justify-center bg-gradient-to-br ${clanColors[clan]} disabled:opacity-70`}>
                            <span>{clanNames[clan]}</span>
                            <span className="text-sm font-normal mt-1 opacity-90">({clanPlayerCounts[clan]} players)</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="flex-grow flex flex-col items-center justify-center p-4 animate-fade-in">
            <Card className="w-full max-w-md">
                {step === 'join' && (
                    <form onSubmit={handleJoin} className="space-y-4">
                        <h1 className="text-3xl font-bold text-center mb-6">Join a Quiz</h1>
                        <input
                            type="text"
                            value={quizId}
                            onChange={(e) => setQuizId(e.target.value.toUpperCase())}
                            className="w-full text-center tracking-widest text-2xl bg-slate-100 border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"
                            placeholder="QUIZ CODE"
                            disabled={!!quizIdFromUrl}
                            aria-label="Quiz Code"
                        />
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full bg-slate-100 border border-slate-300 rounded-md p-3 focus:ring-2 focus:ring-gl-orange-500 focus:outline-none"
                            placeholder="Your Nickname"
                            aria-label="Your Nickname"
                        />
                        <div>
                            <p className="text-center text-slate-600 mb-3">Choose your avatar</p>
                            <div className="grid grid-cols-6 gap-3">
                                {AVATARS.map((avatarSrc, index) => (
                                    <button
                                        type="button"
                                        key={index}
                                        onClick={() => setSelectedAvatar(avatarSrc)}
                                        className={`w-14 h-14 rounded-full cursor-pointer transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-4 focus:ring-gl-orange-500/50 ${selectedAvatar === avatarSrc ? 'ring-4 ring-gl-orange-500' : 'ring-2 ring-slate-300'}`}
                                        aria-label={`Select avatar ${index + 1}`}
                                    >
                                        <img
                                            src={avatarSrc}
                                            alt={`avatar ${index + 1}`}
                                            className="w-full h-full rounded-full"
                                        />
                                    </button>
                                ))}

                            </div>
                        </div>

                        {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                        <Button type="submit" className="bg-gl-orange-600 hover:bg-gl-orange-700" disabled={isJoining}>
                            {isJoining ? 'Joining...' : 'Join Game'}
                        </Button>
                    </form>
                )}
                {step === 'clan' && <ClanSelection />}
            </Card>
        </div>
    );
};

export default JoinQuizPage;