import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { PersonStanding, Dumbbell, History as HistoryIcon, BookOpen, Settings as SettingsIcon, MoreHorizontal, Check, Circle, Plus, Minus, ChevronRight, ChevronDown, ChevronLeft, X, Activity, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref as dbRef, onValue, set as dbSet, goOnline } from 'firebase/database';
import { firebaseConfig } from './firebase.js';

/* ════════════════════════════════════════════════════════════════
   EXERCISE DATABASE  (curated public-domain set, injected at build)
   shape: { n:name, m:primaryRegion, sm:[secondary], eq:equipment,
            lv:level, mech:mechanic, a:movementArchetype, i:instructions }
═══════════════════════════════════════════════════════════════════ */
const EXERCISE_DB = [{"n":"3/4 Sit-Up","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Lie down on the floor and secure your feet.","img":"3_4_Sit-Up"},{"n":"Ab Crunch Machine","m":"abs","sm":[],"eq":"Machine","lv":"I","mech":"I","a":"ab","i":"Select a light resistance and sit down on the ab machine placing your feet under the pads provided and grabbing the top handles.","img":"Ab_Crunch_Machine"},{"n":"Advanced Kettlebell Windmill","m":"abs","sm":["glutes","hamstrings","shoulders"],"eq":"Kettlebell","lv":"I","mech":"I","a":"ab","i":"Clean and press a kettlebell overhead with one arm.","img":"Advanced_Kettlebell_Windmill"},{"n":"Air Bike","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Lie flat on the floor with your lower back pressed to the ground.","img":"Air_Bike"},{"n":"Alternate Hammer Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Stand up with your torso upright and a dumbbell in each hand being held at arms length.","img":"Alternate_Hammer_Curl"},{"n":"Alternate Heel Touchers","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Lie on the floor with the knees bent and the feet on the floor around 18-24 inches apart.","img":"Alternate_Heel_Touchers"},{"n":"Alternate Incline Dumbbell Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Sit down on an incline bench with a dumbbell in each hand being held at arms length.","img":"Alternate_Incline_Dumbbell_Curl"},{"n":"Alternating Cable Shoulder Press","m":"shoulders","sm":["triceps"],"eq":"Cable","lv":"B","mech":"C","a":"pressvert","i":"Move the cables to the bottom of the tower and select an appropriate weight.","img":"Alternating_Cable_Shoulder_Press"},{"n":"Alternating Deltoid Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"In a standing position, hold a pair of dumbbells at your side.","img":"Alternating_Deltoid_Raise"},{"n":"Alternating Floor Press","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Kettlebell","lv":"B","mech":"C","a":"presshoriz","i":"Lie on the floor with two kettlebells next to your shoulders.","img":"Alternating_Floor_Press"},{"n":"Alternating Hang Clean","m":"hamstrings","sm":["biceps","calves","forearms","glutes","lowerback","traps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"Place two kettlebells between your feet.","img":"Alternating_Hang_Clean"},{"n":"Alternating Kettlebell Press","m":"shoulders","sm":["triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean two kettlebells to your shoulders.","img":"Alternating_Kettlebell_Press"},{"n":"Alternating Kettlebell Row","m":"back","sm":["biceps","back"],"eq":"Kettlebell","lv":"I","mech":"I","a":"pullhoriz","i":"Place two kettlebells in front of your feet.","img":"Alternating_Kettlebell_Row"},{"n":"Alternating Renegade Row","m":"back","sm":["abs","biceps","chest","back","triceps"],"eq":"Kettlebell","lv":"E","mech":"C","a":"pullhoriz","i":"Place two kettlebells on the floor about shoulder width apart.","img":"Alternating_Renegade_Row"},{"n":"Anti-Gravity Press","m":"shoulders","sm":["back","traps","triceps"],"eq":"Barbell","lv":"B","mech":"C","a":"pressvert","i":"Place a bar on the ground behind the head of an incline bench.","img":"Anti-Gravity_Press"},{"n":"Arnold Dumbbell Press","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"pressvert","i":"Sit on an exercise bench with back support and hold two dumbbells in front of you at about upper chest level with your palms facing your body and your elbows bent.","img":"Arnold_Dumbbell_Press"},{"n":"Around The Worlds","m":"chest","sm":["shoulders"],"eq":"Dumbbell","lv":"I","mech":"C","a":"presshoriz","i":"Lay down on a flat bench holding a dumbbell in each hand with the palms of the hands facing towards the ceiling.","img":"Around_The_Worlds"},{"n":"Back Flyes - With Bands","m":"shoulders","sm":["back","triceps"],"eq":"Band","lv":"B","mech":"C","a":"fly","i":"Run a band around a stationary post like that of a squat rack. Grab the band by the handles and stand back so that the tension in the band rises.","img":"Back_Flyes_-_With_Bands"},{"n":"Backward Medicine Ball Throw","m":"shoulders","sm":[],"eq":"Med Ball","lv":"B","mech":"C","a":"pullhoriz","i":"This exercise is best done with a partner.","img":"Backward_Medicine_Ball_Throw"},{"n":"Band Good Morning","m":"hamstrings","sm":["glutes","lowerback"],"eq":"Band","lv":"B","mech":"C","a":"hinge","i":"Using a 41 inch band, stand on one end, spreading your feet a small amount.","img":"Band_Good_Morning"},{"n":"Band Good Morning (Pull Through)","m":"hamstrings","sm":["glutes","lowerback"],"eq":"Band","lv":"B","mech":"C","a":"hinge","i":"Loop the band around a post.","img":"Band_Good_Morning_Pull_Through"},{"n":"Band Hip Adductions","m":"quads","sm":[],"eq":"Band","lv":"B","mech":"I","a":"generic","i":"Anchor a band around a solid post or other object. Stand with your left side to the post, and put your right foot through the band, getting it around the ankle.","img":"Band_Hip_Adductions"},{"n":"Band Pull Apart","m":"shoulders","sm":["back","traps"],"eq":"Band","lv":"B","mech":"I","a":"pressvert","i":"Begin with your arms extended straight out in front of you, holding the band with both hands.","img":"Band_Pull_Apart"},{"n":"Band Skull Crusher","m":"triceps","sm":[],"eq":"Band","lv":"B","mech":"I","a":"extension","i":"Secure a band to the base of a rack or the bench.","img":"Band_Skull_Crusher"},{"n":"Barbell Ab Rollout","m":"abs","sm":["lowerback","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"ab","i":"For this exercise you will need to get into a pushup position, but instead of having your hands of the floor, you will be grabbing on to an Olympic barbell (loaded with…","img":"Barbell_Ab_Rollout"},{"n":"Barbell Ab Rollout - On Knees","m":"abs","sm":["lowerback","shoulders"],"eq":"Barbell","lv":"E","mech":"C","a":"ab","i":"Hold an Olympic barbell loaded with 5-10lbs on each side and kneel on the floor.","img":"Barbell_Ab_Rollout_-_On_Knees"},{"n":"Barbell Bench Press - Medium Grip","m":"chest","sm":["shoulders","triceps"],"eq":"Barbell","lv":"B","mech":"C","a":"presshoriz","i":"Lie back on a flat bench.","img":"Barbell_Bench_Press_-_Medium_Grip"},{"n":"Barbell Curl","m":"biceps","sm":["forearms"],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Stand up with your torso upright while holding a barbell at a shoulder-width grip.","img":"Barbell_Curl"},{"n":"Barbell Curls Lying Against An Incline","m":"biceps","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Lie against an incline bench, with your arms holding a barbell and hanging down in a horizontal line.","img":"Barbell_Curls_Lying_Against_An_Incline"},{"n":"Barbell Deadlift","m":"lowerback","sm":["calves","forearms","glutes","hamstrings","back","back","quads","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Stand in front of a loaded barbell.","img":"Barbell_Deadlift"},{"n":"Barbell Full Squat","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Barbell_Full_Squat"},{"n":"Barbell Glute Bridge","m":"glutes","sm":["calves","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"hipthrust","i":"Begin seated on the ground with a loaded barbell over your legs.","img":"Barbell_Glute_Bridge"},{"n":"Barbell Guillotine Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Using a medium width grip (a grip that creates a 90-degree angle in the middle of the movement between the forearms and the upper arms), lift the bar from the rack and…","img":"Barbell_Guillotine_Bench_Press"},{"n":"Barbell Hack Squat","m":"quads","sm":["calves","forearms","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Stand up straight while holding a barbell behind you at arms length and your feet at shoulder width.","img":"Barbell_Hack_Squat"},{"n":"Barbell Hip Thrust","m":"glutes","sm":["calves","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"hipthrust","i":"Begin seated on the ground with a bench directly behind you.","img":"Barbell_Hip_Thrust"},{"n":"Barbell Incline Bench Press - Medium Grip","m":"chest","sm":["shoulders","triceps"],"eq":"Barbell","lv":"B","mech":"C","a":"presshoriz","i":"Lie back on an incline bench.","img":"Barbell_Incline_Bench_Press_-_Medium_Grip"},{"n":"Barbell Incline Shoulder Raise","m":"shoulders","sm":["chest"],"eq":"Barbell","lv":"B","mech":"C","a":"pressvert","i":"Lie back on an Incline Bench.","img":"Barbell_Incline_Shoulder_Raise"},{"n":"Barbell Lunge","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"lunge","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Barbell_Lunge"},{"n":"Barbell Rear Delt Row","m":"shoulders","sm":["biceps","back","back"],"eq":"Barbell","lv":"B","mech":"C","a":"rearfly","i":"Stand up straight while holding a barbell using a wide (higher than shoulder width) and overhand (palms facing your body) grip.","img":"Barbell_Rear_Delt_Row"},{"n":"Barbell Rollout from Bench","m":"abs","sm":["glutes","hamstrings","back","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Place a loaded barbell on the ground, near the end of a bench.","img":"Barbell_Rollout_from_Bench"},{"n":"Barbell Seated Calf Raise","m":"calves","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"calf","i":"Place a block about 12 inches in front of a flat bench. Sit on the bench and place the ball of your feet on the block.","img":"Barbell_Seated_Calf_Raise"},{"n":"Barbell Shoulder Press","m":"shoulders","sm":["chest","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"Sit on a bench with back support in a squat rack.","img":"Barbell_Shoulder_Press"},{"n":"Barbell Shrug","m":"traps","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"shrug","i":"Stand up straight with your feet at shoulder width as you hold a barbell with both hands in front of you using a pronated grip (palms facing the thighs).","img":"Barbell_Shrug"},{"n":"Barbell Shrug Behind The Back","m":"traps","sm":["forearms","back"],"eq":"Barbell","lv":"B","mech":"I","a":"shrug","i":"Stand up straight with your feet at shoulder width as you hold a barbell with both hands behind your back using a pronated grip (palms facing back).","img":"Barbell_Shrug_Behind_The_Back"},{"n":"Barbell Side Bend","m":"abs","sm":["lowerback"],"eq":"Barbell","lv":"B","mech":"I","a":"ab","i":"Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck).","img":"Barbell_Side_Bend"},{"n":"Barbell Side Split Squat","m":"quads","sm":["calves","hamstrings","lowerback"],"eq":"Barbell","lv":"B","mech":"C","a":"squat","i":"Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck).","img":"Barbell_Side_Split_Squat"},{"n":"Barbell Squat","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"B","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Barbell_Squat"},{"n":"Barbell Squat To A Bench","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Barbell_Squat_To_A_Bench"},{"n":"Barbell Step Ups","m":"quads","sm":["calves","glutes","hamstrings","quads"],"eq":"Barbell","lv":"I","mech":"C","a":"lunge","i":"Stand up straight while holding a barbell placed on the back of your shoulders (slightly below the neck) and stand upright behind an elevated platform (such as the one…","img":"Barbell_Step_Ups"},{"n":"Barbell Walking Lunge","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"B","mech":"C","a":"lunge","i":"Begin standing with your feet shoulder width apart and a barbell across your upper back.","img":"Barbell_Walking_Lunge"},{"n":"Bench Dips","m":"triceps","sm":["chest","shoulders"],"eq":"Bodyweight","lv":"B","mech":"C","a":"extension","i":"For this exercise you will need to place a bench behind your back.","img":"Bench_Dips"},{"n":"Bench Jump","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Bodyweight","lv":"I","mech":"C","a":"presshoriz","i":"Begin with a box or bench 1-2 feet in front of you.","img":"Bench_Jump"},{"n":"Bench Press - Powerlifting","m":"triceps","sm":["chest","forearms","back","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Begin by lying on the bench, getting your head beyond the bar if possible.","img":"Bench_Press_-_Powerlifting"},{"n":"Bench Press - With Bands","m":"chest","sm":["shoulders","triceps"],"eq":"Band","lv":"B","mech":"C","a":"presshoriz","i":"Using a flat bench secure a band under the leg of the bench that is nearest to your head. Once the band is secure, grab it by both handles and lie down on the bench.","img":"Bench_Press_-_With_Bands"},{"n":"Bench Press with Chains","m":"triceps","sm":["chest","back","shoulders"],"eq":"Barbell","lv":"E","mech":"C","a":"presshoriz","i":"Adjust the leader chain, shortening it to the desired length.Place the chains on the sleeves of the bar.","img":"Bench_Press_with_Chains"},{"n":"Bent-Arm Barbell Pullover","m":"back","sm":["chest","back","shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pullhoriz","i":"Lie on a flat bench with a barbell using a shoulder grip width. Hold the bar straight over your chest with a bend in your arms. This will be your starting position.","img":"Bent-Arm_Barbell_Pullover"},{"n":"Bent-Arm Dumbbell Pullover","m":"chest","sm":["back","shoulders","triceps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"presshoriz","i":"Place a dumbbell standing up on a flat bench.","img":"Bent-Arm_Dumbbell_Pullover"},{"n":"Bent-Knee Hip Raise","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Lay flat on the floor with your arms next to your sides. Now bend your knees at around a 75 degree angle and lift your feet off the floor by around 2 inches.","img":"Bent-Knee_Hip_Raise"},{"n":"Bent Over Barbell Row","m":"back","sm":["biceps","back","shoulders"],"eq":"Barbell","lv":"B","mech":"C","a":"pullhoriz","i":"Holding a barbell with a pronated grip (palms facing down), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back…","img":"Bent_Over_Barbell_Row"},{"n":"Bent Over Dumbbell Rear Delt Raise With Head On Bench","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"rearfly","i":"Stand up straight while holding a dumbbell in each hand and with an incline bench in front of you.","img":"Bent_Over_Dumbbell_Rear_Delt_Raise_With_Head_On_Bench"},{"n":"Bent Over Low-Pulley Side Lateral","m":"shoulders","sm":["lowerback","back","traps"],"eq":"Cable","lv":"B","mech":"I","a":"lateralraise","i":"Select a weight and hold the handle of the low pulley with your right hand.","img":"Bent_Over_Low-Pulley_Side_Lateral"},{"n":"Bent Over One-Arm Long Bar Row","m":"back","sm":["biceps","back","lowerback","traps"],"eq":"Barbell","lv":"B","mech":"C","a":"pullhoriz","i":"Put weight on one of the ends of an Olympic barbell.","img":"Bent_Over_One-Arm_Long_Bar_Row"},{"n":"Bent Over Two-Arm Long Bar Row","m":"back","sm":["biceps","back"],"eq":"Barbell","lv":"I","mech":"C","a":"pullhoriz","i":"Put weight on one of the ends of an Olympic barbell.","img":"Bent_Over_Two-Arm_Long_Bar_Row"},{"n":"Bent Over Two-Dumbbell Row","m":"back","sm":["biceps","back","shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pullhoriz","i":"With a dumbbell in each hand (palms facing your torso), bend your knees slightly and bring your torso forward by bending at the waist; as you bend make sure to keep your…","img":"Bent_Over_Two-Dumbbell_Row"},{"n":"Bent Over Two-Dumbbell Row With Palms In","m":"back","sm":["biceps","back"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pullhoriz","i":"With a dumbbell in each hand (palms facing each other), bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back straight…","img":"Bent_Over_Two-Dumbbell_Row_With_Palms_In"},{"n":"Bent Press","m":"abs","sm":["glutes","hamstrings","lowerback","quads","shoulders","triceps"],"eq":"Kettlebell","lv":"E","mech":"C","a":"ab","i":"Clean a kettlebell to your shoulder.","img":"Bent_Press"},{"n":"Board Press","m":"triceps","sm":["chest","forearms","back","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"extension","i":"Begin by lying on the bench, getting your head beyond the bar if possible.","img":"Board_Press"},{"n":"Body-Up","m":"triceps","sm":["abs","forearms"],"eq":"Bodyweight","lv":"I","mech":"I","a":"extension","i":"Assume a plank position on the ground.","img":"Body-Up"},{"n":"Body Tricep Press","m":"triceps","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"extension","i":"Position a bar in a rack at chest height.","img":"Body_Tricep_Press"},{"n":"Bodyweight Flyes","m":"chest","sm":["abs","shoulders","triceps"],"eq":"EZ Bar","lv":"I","mech":"I","a":"fly","i":"Position two equally loaded EZ bars on the ground next to each other.","img":"Bodyweight_Flyes"},{"n":"Bodyweight Squat","m":"quads","sm":["glutes","hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"Stand with your feet shoulder width apart.","img":"Bodyweight_Squat"},{"n":"Bosu Ball Cable Crunch With Side Bends","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Connect a standard handle to each arm of a cable machine, and position them in the most downward position.","img":"Bosu_Ball_Cable_Crunch_With_Side_Bends"},{"n":"Bottoms-Up Clean From The Hang Position","m":"forearms","sm":["biceps","shoulders"],"eq":"Kettlebell","lv":"I","mech":"C","a":"curl","i":"Initiate the exercise by standing upright with a kettlebell in one hand.","img":"Bottoms-Up_Clean_From_The_Hang_Position"},{"n":"Bottoms Up","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Begin by lying on your back on the ground.","img":"Bottoms_Up"},{"n":"Box Squat","m":"quads","sm":["quads","calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"The box squat allows you to squat to desired depth and develop explosive strength in the squat movement.","img":"Box_Squat"},{"n":"Box Squat with Bands","m":"quads","sm":["glutes","quads","calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Begin in a power rack with a box at the appropriate height behind you.","img":"Box_Squat_with_Bands"},{"n":"Box Squat with Chains","m":"quads","sm":["glutes","quads","calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Begin in a power rack with a box at the appropriate height behind you.","img":"Box_Squat_with_Chains"},{"n":"Bradford/Rocky Presses","m":"shoulders","sm":["triceps"],"eq":"Barbell","lv":"B","mech":"C","a":"pressvert","i":"Sit on a Military Press Bench with a bar at shoulder level with a pronated grip (palms facing forward).","img":"Bradford_Rocky_Presses"},{"n":"Butt-Ups","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Begin a pushup position but with your elbows on the ground and resting on your forearms.","img":"Butt-Ups"},{"n":"Butt Lift (Bridge)","m":"glutes","sm":["hamstrings"],"eq":"Bodyweight","lv":"B","mech":"I","a":"hipthrust","i":"Lie flat on the floor on your back with the hands by your side and your knees bent.","img":"Butt_Lift_Bridge"},{"n":"Butterfly","m":"chest","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"fly","i":"Sit on the machine with your back flat on the pad.","img":"Butterfly"},{"n":"Cable Chest Press","m":"chest","sm":["shoulders","triceps"],"eq":"Cable","lv":"B","mech":"C","a":"presshoriz","i":"Adjust the weight to an appropriate amount and be seated, grasping the handles.","img":"Cable_Chest_Press"},{"n":"Cable Crossover","m":"chest","sm":["shoulders"],"eq":"Cable","lv":"B","mech":"I","a":"fly","i":"To get yourself into the starting position, place the pulleys on a high position (above your head), select the resistance to be used and hold the pulleys in each hand.","img":"Cable_Crossover"},{"n":"Cable Crunch","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Kneel below a high pulley that contains a rope attachment. Grasp cable rope attachment and lower the rope until your hands are placed next to your face.","img":"Cable_Crunch"},{"n":"Cable Deadlifts","m":"quads","sm":["forearms","glutes","hamstrings","lowerback"],"eq":"Cable","lv":"B","mech":"C","a":"hinge","i":"Move the cables to the bottom of the towers and select an appropriate weight.","img":"Cable_Deadlifts"},{"n":"Cable Hammer Curls - Rope Attachment","m":"biceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"curl","i":"Attach a rope attachment to a low pulley and stand facing the machine about 12 inches away from it.","img":"Cable_Hammer_Curls_-_Rope_Attachment"},{"n":"Cable Hip Adduction","m":"quads","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"squat","i":"Stand in front of a low pulley facing forward with one leg next to the pulley and the other one away.","img":"Cable_Hip_Adduction"},{"n":"Cable Incline Pushdown","m":"back","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Lie on incline an bench facing away from a high pulley machine that has a straight bar attachment on it.","img":"Cable_Incline_Pushdown"},{"n":"Cable Incline Triceps Extension","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Lie on incline an bench facing away from a high pulley machine that has a straight bar attachment on it.","img":"Cable_Incline_Triceps_Extension"},{"n":"Cable Internal Rotation","m":"shoulders","sm":[],"eq":"Cable","lv":"B","mech":"C","a":"pressvert","i":"Sit next to a low pulley sideways (with legs stretched in front of you or crossed) and grasp the single hand cable attachment with the arm nearest to the cable.","img":"Cable_Internal_Rotation"},{"n":"Cable Iron Cross","m":"chest","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"presshoriz","i":"Begin by moving the pulleys to the high position, select the resistance to be used, and take a handle in each hand.","img":"Cable_Iron_Cross"},{"n":"Cable Judo Flip","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"C","a":"ab","i":"Connect a rope attachment to a tower, and move the cable to the lowest pulley position.","img":"Cable_Judo_Flip"},{"n":"Cable Lying Triceps Extension","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Lie on a flat bench and grasp the straight bar attachment of a low pulley with a narrow overhand grip.","img":"Cable_Lying_Triceps_Extension"},{"n":"Cable One Arm Tricep Extension","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"With your right hand, grasp a single handle attached to the high-cable pulley using a supinated (underhand; palms facing up) grip.","img":"Cable_One_Arm_Tricep_Extension"},{"n":"Cable Preacher Curl","m":"biceps","sm":["forearms"],"eq":"Cable","lv":"B","mech":"I","a":"curl","i":"Place a preacher bench about 2 feet in front of a pulley machine. Attach a straight bar to the low pulley.","img":"Cable_Preacher_Curl"},{"n":"Cable Rear Delt Fly","m":"shoulders","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"rearfly","i":"Adjust the pulleys to the appropriate height and adjust the weight.","img":"Cable_Rear_Delt_Fly"},{"n":"Cable Reverse Crunch","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Connect an ankle strap attachment to a low pulley cable and position a mat on the floor in front of it.","img":"Cable_Reverse_Crunch"},{"n":"Cable Rope Overhead Triceps Extension","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Attach a rope to the bottom pulley of the pulley machine.","img":"Cable_Rope_Overhead_Triceps_Extension"},{"n":"Cable Rope Rear-Delt Rows","m":"shoulders","sm":["biceps","back"],"eq":"Cable","lv":"B","mech":"C","a":"pullhoriz","i":"Sit in the same position on a low pulley row station as you would if you were doing seated cable rows for the back.","img":"Cable_Rope_Rear-Delt_Rows"},{"n":"Cable Russian Twists","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"C","a":"ab","i":"Connect a standard handle attachment, and position the cable to a middle pulley position.","img":"Cable_Russian_Twists"},{"n":"Cable Seated Crunch","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Seat on a flat bench with your back facing a high pulley.","img":"Cable_Seated_Crunch"},{"n":"Cable Seated Lateral Raise","m":"shoulders","sm":["back","traps"],"eq":"Cable","lv":"B","mech":"I","a":"lateralraise","i":"Stand in the middle of two low pulleys that are opposite to each other and place a flat bench right behind you (in perpendicular fashion to you; the narrow edge of the…","img":"Cable_Seated_Lateral_Raise"},{"n":"Cable Shoulder Press","m":"shoulders","sm":["triceps"],"eq":"Cable","lv":"B","mech":"C","a":"pressvert","i":"Move the cables to the bottom of the towers and select an appropriate weight.","img":"Cable_Shoulder_Press"},{"n":"Cable Shrugs","m":"traps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"shrug","i":"Grasp a cable bar attachment that is attached to a low pulley with a shoulder width or slightly wider overhand (palms facing down) grip.","img":"Cable_Shrugs"},{"n":"Cable Wrist Curl","m":"forearms","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"curl","i":"Start out by placing a flat bench in front of a low pulley cable that has a straight bar attachment.","img":"Cable_Wrist_Curl"},{"n":"Calf-Machine Shoulder Shrug","m":"traps","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"calf","i":"Position yourself on the calf machine so that the shoulder pads are above your shoulders.","img":"Calf-Machine_Shoulder_Shrug"},{"n":"Calf Press","m":"calves","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"calf","i":"Adjust the seat so that your legs are only slightly bent in the start position.","img":"Calf_Press"},{"n":"Calf Press On The Leg Press Machine","m":"calves","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"calf","i":"Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance.","img":"Calf_Press_On_The_Leg_Press_Machine"},{"n":"Calf Raise On A Dumbbell","m":"calves","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"calf","i":"Hang on to a sturdy object for balance and stand on a dumbbell handle, preferably one with round plates so that it rolls as in this manner you have to work harder to…","img":"Calf_Raise_On_A_Dumbbell"},{"n":"Calf Raises - With Bands","m":"calves","sm":[],"eq":"Band","lv":"B","mech":"I","a":"calf","i":"Grab an exercise band and stand on it with your toes making sure that the length of the band between the foot and the arms is the same for both sides.","img":"Calf_Raises_-_With_Bands"},{"n":"Car Drivers","m":"shoulders","sm":["forearms"],"eq":"Barbell","lv":"B","mech":"I","a":"pressvert","i":"While standing upright, hold a barbell plate in both hands at the 3 and 9 o'clock positions.","img":"Car_Drivers"},{"n":"Catch and Overhead Throw","m":"back","sm":["abs","chest","shoulders"],"eq":"Med Ball","lv":"B","mech":"C","a":"pullhoriz","i":"Begin standing while facing a wall or a partner.","img":"Catch_and_Overhead_Throw"},{"n":"Chair Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"B","mech":"C","a":"squat","i":"To begin, first set the bar to a position that best matches your height.","img":"Chair_Squat"},{"n":"Chest Push from 3 point stance","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Med Ball","lv":"B","mech":"C","a":"presshoriz","i":"Begin in a three point stance, squatted down with your back flat and one hand on the ground.","img":"Chest_Push_from_3_point_stance"},{"n":"Chest Push (multiple response)","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Med Ball","lv":"B","mech":"C","a":"presshoriz","i":"Begin in a kneeling position facing a wall or utilize a partner.","img":"Chest_Push_multiple_response"},{"n":"Chest Push (single response)","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Med Ball","lv":"B","mech":"C","a":"presshoriz","i":"Begin in a kneeling position holding the medicine ball with both hands tightly into the chest.","img":"Chest_Push_single_response"},{"n":"Chest Push with Run Release","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Med Ball","lv":"B","mech":"C","a":"presshoriz","i":"Begin in an athletic stance with the knees bent, hips back, and back flat.","img":"Chest_Push_with_Run_Release"},{"n":"Chin-Up","m":"back","sm":["biceps","forearms","back"],"eq":"Bodyweight","lv":"B","mech":"C","a":"pullvert","i":"Grab the pull-up bar with the palms facing your torso and a grip closer than the shoulder width.","img":"Chin-Up"},{"n":"Clean","m":"hamstrings","sm":["calves","forearms","glutes","lowerback","quads","shoulders","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"With a barbell on the floor close to the shins, take an overhand (or hook) grip just outside the legs.","img":"Clean"},{"n":"Clean Deadlift","m":"hamstrings","sm":["forearms","glutes","lowerback","back","quads","traps"],"eq":"Barbell","lv":"B","mech":"C","a":"hinge","i":"Begin standing with a barbell close to your shins.","img":"Clean_Deadlift"},{"n":"Clean Pull","m":"quads","sm":["forearms","glutes","hamstrings","lowerback","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"With a barbell on the floor close to the shins, take an overhand or hook grip just outside the legs.","img":"Clean_Pull"},{"n":"Clean Shrug","m":"traps","sm":["forearms","shoulders"],"eq":"Barbell","lv":"B","mech":"C","a":"shrug","i":"Begin with a shoulder width, double overhand or hook grip, with the bar hanging at the mid thigh position.","img":"Clean_Shrug"},{"n":"Clean and Jerk","m":"shoulders","sm":["abs","glutes","hamstrings","lowerback","quads","traps","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"pressvert","i":"With a barbell on the floor close to the shins, take an overhand or hook grip just outside the legs.","img":"Clean_and_Jerk"},{"n":"Clean and Press","m":"shoulders","sm":["abs","calves","glutes","hamstrings","lowerback","back","quads","shoulders","traps","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"Assume a shoulder-width stance, with knees inside the arms.","img":"Clean_and_Press"},{"n":"Clean from Blocks","m":"quads","sm":["calves","glutes","hamstrings","shoulders","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"With a barbell on boxes or stands of the desired height, take an overhand or hook grip just outside the legs.","img":"Clean_from_Blocks"},{"n":"Clock Push-Up","m":"chest","sm":["shoulders","triceps"],"eq":"Bodyweight","lv":"I","mech":"C","a":"presshoriz","i":"Move into a prone position on the floor, supporting your weight on your hands and toes.","img":"Clock_Push-Up"},{"n":"Close-Grip Barbell Bench Press","m":"triceps","sm":["chest","shoulders"],"eq":"Barbell","lv":"B","mech":"C","a":"extension","i":"Lie back on a flat bench.","img":"Close-Grip_Barbell_Bench_Press"},{"n":"Close-Grip Dumbbell Press","m":"triceps","sm":["chest","shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"extension","i":"Place a dumbbell standing up on a flat bench.","img":"Close-Grip_Dumbbell_Press"},{"n":"Close-Grip EZ-Bar Curl with Band","m":"biceps","sm":["forearms"],"eq":"EZ Bar","lv":"B","mech":"I","a":"curl","i":"Attach a band to each end of the bar.","img":"Close-Grip_EZ-Bar_Curl_with_Band"},{"n":"Close-Grip EZ-Bar Press","m":"triceps","sm":["chest","shoulders"],"eq":"EZ Bar","lv":"B","mech":"C","a":"extension","i":"Lie on a flat bench with an EZ bar loaded to an appropriate weight.","img":"Close-Grip_EZ-Bar_Press"},{"n":"Close-Grip EZ Bar Curl","m":"biceps","sm":["forearms"],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Stand up with your torso upright while holding an E-Z Curl Bar at the closer inner handle.","img":"Close-Grip_EZ_Bar_Curl"},{"n":"Close-Grip Front Lat Pulldown","m":"back","sm":["biceps","back","shoulders"],"eq":"Cable","lv":"B","mech":"C","a":"extension","i":"Sit down on a pull-down machine with a wide bar attached to the top pulley.","img":"Close-Grip_Front_Lat_Pulldown"},{"n":"Close-Grip Push-Up off of a Dumbbell","m":"triceps","sm":["abs","chest","shoulders"],"eq":"Bodyweight","lv":"I","mech":"C","a":"extension","i":"Lie on the floor and place your hands on an upright dumbbell.","img":"Close-Grip_Push-Up_off_of_a_Dumbbell"},{"n":"Close-Grip Standing Barbell Curl","m":"biceps","sm":["forearms"],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Hold a barbell with both hands, palms up and a few inches apart.","img":"Close-Grip_Standing_Barbell_Curl"},{"n":"Cocoons","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Begin by lying on your back on the ground.","img":"Cocoons"},{"n":"Concentration Curls","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Sit down on a flat bench with one dumbbell in front of you between your legs.","img":"Concentration_Curls"},{"n":"Cross-Body Crunch","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Lie flat on your back and bend your knees about 60 degrees.","img":"Cross-Body_Crunch"},{"n":"Cross Body Hammer Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Stand up straight with a dumbbell in each hand.","img":"Cross_Body_Hammer_Curl"},{"n":"Cross Over - With Bands","m":"chest","sm":["biceps","shoulders"],"eq":"Band","lv":"B","mech":"C","a":"presshoriz","i":"Secure an exercise band around a stationary post.","img":"Cross_Over_-_With_Bands"},{"n":"Crunch - Hands Overhead","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Lie on the floor with your back flat and knees bent with around a 60-degree angle between the hamstrings and the calves.","img":"Crunch_-_Hands_Overhead"},{"n":"Crunch - Legs On Exercise Ball","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Lie flat on your back with your feet resting on an exercise ball and your knees bent at a 90 degree angle.","img":"Crunch_-_Legs_On_Exercise_Ball"},{"n":"Crunches","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Lie flat on your back with your feet flat on the ground, or resting on a bench with your knees bent at a 90 degree angle.","img":"Crunches"},{"n":"Cuban Press","m":"shoulders","sm":["traps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"pressvert","i":"Take a dumbbell in each hand with a pronated grip in a standing position.","img":"Cuban_Press"},{"n":"Dead Bug","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Begin lying on your back with your hands extended above you toward the ceiling. Bring your feet, knees, and hips up to 90 degrees.","img":"Dead_Bug"},{"n":"Deadlift with Bands","m":"lowerback","sm":["forearms","glutes","hamstrings","back","quads","traps"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"To deadlift with short bands, simply loop them over the bar before you start, and step into them to set up.","img":"Deadlift_with_Bands"},{"n":"Deadlift with Chains","m":"lowerback","sm":["forearms","glutes","hamstrings","back","quads","traps"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"You can attach the chains to the sleeves of the bar, or just drape the middle over the bar so there is a greater weight increase as you lift.","img":"Deadlift_with_Chains"},{"n":"Decline Barbell Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Barbell","lv":"B","mech":"C","a":"presshoriz","i":"Secure your legs at the end of the decline bench and slowly lay down on the bench.","img":"Decline_Barbell_Bench_Press"},{"n":"Decline Close-Grip Bench To Skull Crusher","m":"triceps","sm":["chest","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"extension","i":"Secure your legs at the end of the decline bench and slowly lay down on the bench.","img":"Decline_Close-Grip_Bench_To_Skull_Crusher"},{"n":"Decline Crunch","m":"abs","sm":[],"eq":"Bodyweight","lv":"I","mech":"I","a":"ab","i":"Secure your legs at the end of the decline bench and lie down.","img":"Decline_Crunch"},{"n":"Decline Dumbbell Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"presshoriz","i":"Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs.","img":"Decline_Dumbbell_Bench_Press"},{"n":"Decline Dumbbell Flyes","m":"chest","sm":[],"eq":"Dumbbell","lv":"B","mech":"C","a":"fly","i":"Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs.","img":"Decline_Dumbbell_Flyes"},{"n":"Decline Dumbbell Triceps Extension","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"Secure your legs at the end of the decline bench and lie down with a dumbbell on each hand on top of your thighs.","img":"Decline_Dumbbell_Triceps_Extension"},{"n":"Decline EZ Bar Triceps Extension","m":"triceps","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"extension","i":"Secure your legs at the end of the decline bench and slowly lay down on the bench.","img":"Decline_EZ_Bar_Triceps_Extension"},{"n":"Decline Oblique Crunch","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Secure your legs at the end of the decline bench and slowly lay down on the bench.","img":"Decline_Oblique_Crunch"},{"n":"Decline Reverse Crunch","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Lie on your back on a decline bench and hold on to the top of the bench with both hands.","img":"Decline_Reverse_Crunch"},{"n":"Decline Smith Press","m":"chest","sm":["shoulders","triceps"],"eq":"Machine","lv":"B","mech":"C","a":"presshoriz","i":"Place a decline bench underneath the Smith machine.","img":"Decline_Smith_Press"},{"n":"Deficit Deadlift","m":"lowerback","sm":["forearms","glutes","hamstrings","back","quads","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Begin by having a platform or weight plates that you can stand on, usually 1-3 inches in height.","img":"Deficit_Deadlift"},{"n":"Dip Machine","m":"triceps","sm":["chest","shoulders"],"eq":"Machine","lv":"B","mech":"C","a":"extension","i":"Sit securely in a dip machine, select the weight and firmly grasp the handles.","img":"Dip_Machine"},{"n":"Dips - Triceps Version","m":"triceps","sm":["chest","shoulders"],"eq":"Bodyweight","lv":"B","mech":"C","a":"extension","i":"To get into the starting position, hold your body at arm's length with your arms nearly locked above the bars.","img":"Dips_-_Triceps_Version"},{"n":"Double Kettlebell Alternating Hang Clean","m":"hamstrings","sm":["biceps","calves","forearms","glutes","lowerback","quads","traps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"Place two kettlebells between your feet.","img":"Double_Kettlebell_Alternating_Hang_Clean"},{"n":"Double Kettlebell Jerk","m":"shoulders","sm":["calves","quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Hold a kettlebell by the handle in each hand.","img":"Double_Kettlebell_Jerk"},{"n":"Double Kettlebell Push Press","m":"shoulders","sm":["calves","quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean two kettlebells to your shoulders. Squat down a few inches and reverse the motion rapidly. Use the momentum from the legs to drive the kettlebells overhead.","img":"Double_Kettlebell_Push_Press"},{"n":"Double Kettlebell Snatch","m":"shoulders","sm":["glutes","hamstrings","quads"],"eq":"Kettlebell","lv":"E","mech":"C","a":"pressvert","i":"Place two kettlebells behind your feet.","img":"Double_Kettlebell_Snatch"},{"n":"Double Kettlebell Windmill","m":"abs","sm":["glutes","hamstrings","shoulders","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"ab","i":"Place a kettlebell in front of your front foot and clean and press a kettlebell overhead with your opposite arm.","img":"Double_Kettlebell_Windmill"},{"n":"Double Leg Butt Kick","m":"quads","sm":["glutes","quads","calves","glutes","hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"Begin standing with your knees slightly bent. Quickly squat a short distance, flexing the hips and knees, and immediately extend to jump for maximum vertical height.","img":"Double_Leg_Butt_Kick"},{"n":"Drag Curl","m":"biceps","sm":["forearms"],"eq":"Barbell","lv":"I","mech":"C","a":"curl","i":"Grab a barbell with a supinated grip (palms facing forward) and get your elbows close to your torso and back.","img":"Drag_Curl"},{"n":"Dumbbell Alternate Bicep Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Stand (torso upright) with a dumbbell in each hand held at arms length.","img":"Dumbbell_Alternate_Bicep_Curl"},{"n":"Dumbbell Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"presshoriz","i":"Lie down on a flat bench with a dumbbell in each hand resting on top of your thighs.","img":"Dumbbell_Bench_Press"},{"n":"Dumbbell Bench Press with Neutral Grip","m":"chest","sm":["shoulders","triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"presshoriz","i":"Take a dumbbell in each hand and lay back onto a flat bench.","img":"Dumbbell_Bench_Press_with_Neutral_Grip"},{"n":"Dumbbell Bicep Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Stand up straight with a dumbbell in each hand at arm's length.","img":"Dumbbell_Bicep_Curl"},{"n":"Dumbbell Clean","m":"hamstrings","sm":["calves","forearms","glutes","lowerback","quads","shoulders","traps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"hinge","i":"Begin standing with a dumbbell in each hand with your feet shoulder width apart.","img":"Dumbbell_Clean"},{"n":"Dumbbell Floor Press","m":"triceps","sm":["chest","shoulders"],"eq":"Dumbbell","lv":"I","mech":"C","a":"presshoriz","i":"Lay on the floor holding dumbbells in your hands.","img":"Dumbbell_Floor_Press"},{"n":"Dumbbell Flyes","m":"chest","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"fly","i":"Lie down on a flat bench with a dumbbell on each hand resting on top of your thighs.","img":"Dumbbell_Flyes"},{"n":"Dumbbell Incline Row","m":"back","sm":["biceps","forearms","back","shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pullhoriz","i":"Using a neutral grip, lean into an incline bench. Take a dumbbell in each hand with a neutral grip, beginning with the arms straight. This will be your starting position.","img":"Dumbbell_Incline_Row"},{"n":"Dumbbell Incline Shoulder Raise","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"Sit on an Incline Bench while holding a dumbbell on each hand on top of your thighs.","img":"Dumbbell_Incline_Shoulder_Raise"},{"n":"Dumbbell Lunges","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Dumbbell","lv":"B","mech":"C","a":"lunge","i":"Stand with your torso upright holding two dumbbells in your hands by your sides.","img":"Dumbbell_Lunges"},{"n":"Dumbbell Lying One-Arm Rear Lateral Raise","m":"shoulders","sm":["back"],"eq":"Dumbbell","lv":"I","mech":"I","a":"lateralraise","i":"While holding a dumbbell in one hand, lay with your chest down on a slightly inclined (around 15 degrees when measured from the floor) adjustable bench.","img":"Dumbbell_Lying_One-Arm_Rear_Lateral_Raise"},{"n":"Dumbbell Lying Pronation","m":"forearms","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"curl","i":"Lie on a flat bench face down with one arm holding a dumbbell and the other hand on top of the bench folded so that you can rest your head on it.","img":"Dumbbell_Lying_Pronation"},{"n":"Dumbbell Lying Rear Lateral Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"lateralraise","i":"While holding a dumbbell in each hand, lay with your chest down on a slightly inclined (around 15 degrees when measured from the floor) adjustable bench.","img":"Dumbbell_Lying_Rear_Lateral_Raise"},{"n":"Dumbbell Lying Supination","m":"forearms","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"curl","i":"Lie sideways on a flat bench with one arm holding a dumbbell and the other hand on top of the bench folded so that you can rest your head on it.","img":"Dumbbell_Lying_Supination"},{"n":"Dumbbell One-Arm Shoulder Press","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"pressvert","i":"Grab a dumbbell and either sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs or stand up straight.","img":"Dumbbell_One-Arm_Shoulder_Press"},{"n":"Dumbbell One-Arm Triceps Extension","m":"triceps","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"extension","i":"Grab a dumbbell and either sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs or stand up straight.","img":"Dumbbell_One-Arm_Triceps_Extension"},{"n":"Dumbbell One-Arm Upright Row","m":"shoulders","sm":["biceps","traps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"pullhoriz","i":"Grab a dumbbell and stand up straight with your arm extended in front of you with a slight bend at the elbows and your back straight.","img":"Dumbbell_One-Arm_Upright_Row"},{"n":"Dumbbell Prone Incline Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"curl","i":"Grab a dumbbell on each hand and lie face down on an incline bench with your shoulders near top of the incline.","img":"Dumbbell_Prone_Incline_Curl"},{"n":"Dumbbell Raise","m":"shoulders","sm":["biceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pressvert","i":"Grab a dumbbell in each arm and stand up straight with your arms extended by your sides with a slight bend at the elbows and your back straight.","img":"Dumbbell_Raise"},{"n":"Dumbbell Rear Lunge","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Dumbbell","lv":"I","mech":"C","a":"lunge","i":"Stand with your torso upright holding two dumbbells in your hands by your sides.","img":"Dumbbell_Rear_Lunge"},{"n":"Dumbbell Scaption","m":"shoulders","sm":["traps"],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"This corrective exercise strengthens the muscles that stabilize your shoulder blade.","img":"Dumbbell_Scaption"},{"n":"Dumbbell Seated Box Jump","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Dumbbell","lv":"I","mech":"C","a":"squat","i":"Position a box a couple feet to the side of a bench.","img":"Dumbbell_Seated_Box_Jump"},{"n":"Dumbbell Seated One-Leg Calf Raise","m":"calves","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"calf","i":"Place a block on the floor about 12 inches from a flat bench. Sit on a flat bench and place a dumbbell on your upper left thigh about 3 inches above your knee.","img":"Dumbbell_Seated_One-Leg_Calf_Raise"},{"n":"Dumbbell Shoulder Press","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"pressvert","i":"While holding a dumbbell in each hand, sit on a military press bench or utility bench that has back support.","img":"Dumbbell_Shoulder_Press"},{"n":"Dumbbell Shrug","m":"traps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"shrug","i":"Stand erect with a dumbbell on each hand (palms facing your torso), arms extended on the sides.","img":"Dumbbell_Shrug"},{"n":"Dumbbell Side Bend","m":"abs","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"ab","i":"Stand up straight while holding a dumbbell on the left hand (palms facing the torso) as you have the right hand holding your waist.","img":"Dumbbell_Side_Bend"},{"n":"Dumbbell Squat","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Dumbbell","lv":"B","mech":"C","a":"squat","i":"Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).","img":"Dumbbell_Squat"},{"n":"Dumbbell Squat To A Bench","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Dumbbell","lv":"I","mech":"C","a":"squat","i":"Stand up straight with a flat bench behind you while holding a dumbbell on each hand (palms facing the side of your legs).","img":"Dumbbell_Squat_To_A_Bench"},{"n":"Dumbbell Step Ups","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Dumbbell","lv":"I","mech":"C","a":"lunge","i":"Stand up straight while holding a dumbbell on each hand (palms facing the side of your legs).","img":"Dumbbell_Step_Ups"},{"n":"Dumbbell Tricep Extension -Pronated Grip","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"Lie down on a flat bench holding two dumbbells directly above your shoulders.","img":"Dumbbell_Tricep_Extension_-Pronated_Grip"},{"n":"EZ-Bar Curl","m":"biceps","sm":[],"eq":"EZ Bar","lv":"B","mech":"I","a":"curl","i":"Stand up straight while holding an EZ curl bar at the wide outer handle.","img":"EZ-Bar_Curl"},{"n":"EZ-Bar Skullcrusher","m":"triceps","sm":["forearms"],"eq":"EZ Bar","lv":"B","mech":"I","a":"extension","i":"Using a close grip, lift the EZ bar and hold it with your elbows in as you lie on the bench.","img":"EZ-Bar_Skullcrusher"},{"n":"Elbow to Knee","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Lie on the floor, crossing your right leg across your bent left knee.","img":"Elbow_to_Knee"},{"n":"Elevated Back Lunge","m":"quads","sm":["glutes","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"lunge","i":"Position a bar onto a rack at shoulder height loaded to an appropriate weight.","img":"Elevated_Back_Lunge"},{"n":"Elevated Cable Rows","m":"back","sm":["back","traps"],"eq":"Cable","lv":"I","mech":"C","a":"pullhoriz","i":"Get a platform of some sort (it can be an aerobics or calf raise platform) that is around 4-6 inches in height. Place it on the seat of the cable row machine.","img":"Elevated_Cable_Rows"},{"n":"Extended Range One-Arm Kettlebell Floor Press","m":"chest","sm":["shoulders","triceps"],"eq":"Kettlebell","lv":"B","mech":"C","a":"presshoriz","i":"Lie on the floor and position a kettlebell for one arm to press.","img":"Extended_Range_One-Arm_Kettlebell_Floor_Press"},{"n":"External Rotation","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"Lie sideways on a flat bench with one arm holding a dumbbell and the other hand on top of the bench folded so that you can rest your head on it.","img":"External_Rotation"},{"n":"External Rotation with Band","m":"shoulders","sm":[],"eq":"Band","lv":"B","mech":"C","a":"pressvert","i":"Choke the band around a post.","img":"External_Rotation_with_Band"},{"n":"External Rotation with Cable","m":"shoulders","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"pressvert","i":"Adjust the cable to the same height as your elbow.","img":"External_Rotation_with_Cable"},{"n":"Face Pull","m":"shoulders","sm":["back"],"eq":"Cable","lv":"I","mech":"C","a":"rearfly","i":"Facing a high pulley with a rope or dual handles attached, pull the weight directly towards your face, separating your hands as you do so.","img":"Face_Pull"},{"n":"Fast Skipping","m":"quads","sm":["glutes","quads","calves","glutes","hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"Start in a relaxed position with one leg slightly forward.","img":"Fast_Skipping"},{"n":"Finger Curls","m":"forearms","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Hold a barbell with both hands and your palms facing up; hands spaced about shoulder width.","img":"Finger_Curls"},{"n":"Flat Bench Cable Flyes","m":"chest","sm":[],"eq":"Cable","lv":"I","mech":"I","a":"fly","i":"Position a flat bench between two low pulleys so that when you are laying on it, your chest will be lined up with the cable pulleys.","img":"Flat_Bench_Cable_Flyes"},{"n":"Flat Bench Leg Pull-In","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Lie on an exercise mat or a flat bench with your legs off the end.","img":"Flat_Bench_Leg_Pull-In"},{"n":"Flat Bench Lying Leg Raise","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"presshoriz","i":"Lie with your back flat on a bench and your legs extended in front of you off the end.","img":"Flat_Bench_Lying_Leg_Raise"},{"n":"Flexor Incline Dumbbell Curls","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Hold the dumbbell towards the side farther from you so that you have more weight on the side closest to you.","img":"Flexor_Incline_Dumbbell_Curls"},{"n":"Floor Press","m":"triceps","sm":["chest","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Adjust the j-hooks so they are at the appropriate height to rack the bar.","img":"Floor_Press"},{"n":"Floor Press with Chains","m":"triceps","sm":["chest","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Adjust the j-hooks so they are at the appropriate height to rack the bar.","img":"Floor_Press_with_Chains"},{"n":"Flutter Kicks","m":"glutes","sm":["hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"hipthrust","i":"On a flat bench lie facedown with the hips on the edge of the bench, the legs straight with toes high off the floor and with the arms on top of the bench holding on to the front edge.","img":"Flutter_Kicks"},{"n":"Frankenstein Squat","m":"quads","sm":["abs","calves","glutes","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"This drill teaches you the proper positioning of both the bar and your body during the clean and front squat.","img":"Frankenstein_Squat"},{"n":"Freehand Jump Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Bodyweight","lv":"I","mech":"C","a":"squat","i":"Cross your arms over your chest. With your head up and your back straight, position your feet at shoulder width.","img":"Freehand_Jump_Squat"},{"n":"Frog Sit-Ups","m":"abs","sm":[],"eq":"Bodyweight","lv":"I","mech":"I","a":"ab","i":"Lie with your back flat on the floor (or exercise mat) and your legs extended in front of you.","img":"Frog_Sit-Ups"},{"n":"Front Barbell Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Front_Barbell_Squat"},{"n":"Front Barbell Squat To A Bench","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Front_Barbell_Squat_To_A_Bench"},{"n":"Front Cable Raise","m":"shoulders","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"pressvert","i":"Select the weight on a low pulley machine and grasp the single hand cable attachment that is attached to the low pulley with your left hand.","img":"Front_Cable_Raise"},{"n":"Front Dumbbell Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs.","img":"Front_Dumbbell_Raise"},{"n":"Front Incline Dumbbell Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"Sit down on an incline bench with the incline set anywhere between 30 to 60 degrees while holding a dumbbell on each hand.","img":"Front_Incline_Dumbbell_Raise"},{"n":"Front Raise And Pullover","m":"chest","sm":["back","shoulders","triceps"],"eq":"Barbell","lv":"B","mech":"C","a":"frontraise","i":"Lie on a flat bench while holding a barbell using a palms down grip that is about 15 inches apart.","img":"Front_Raise_And_Pullover"},{"n":"Front Squat (Clean Grip)","m":"quads","sm":["abs","glutes","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"To begin, first set the bar in a rack slightly below shoulder level.","img":"Front_Squat_Clean_Grip"},{"n":"Front Squats With Two Kettlebells","m":"quads","sm":["calves","glutes"],"eq":"Kettlebell","lv":"I","mech":"C","a":"squat","i":"Clean two kettlebells to your shoulders.","img":"Front_Squats_With_Two_Kettlebells"},{"n":"Front Two-Dumbbell Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"Pick a couple of dumbbells and stand with a straight torso and the dumbbells on front of your thighs at arms length with the palms of the hand facing your thighs.","img":"Front_Two-Dumbbell_Raise"},{"n":"Full Range-Of-Motion Lat Pulldown","m":"back","sm":["biceps","back","shoulders"],"eq":"Cable","lv":"I","mech":"C","a":"pullvert","i":"Either standing or seated on a high bench, grasp two stirrup cables that are attached to the high pulleys.","img":"Full_Range-Of-Motion_Lat_Pulldown"},{"n":"Glute Ham Raise","m":"hamstrings","sm":["calves","glutes"],"eq":"Machine","lv":"I","mech":"C","a":"hinge","i":"Begin by adjusting the equipment to fit your body.","img":"Glute_Ham_Raise"},{"n":"Glute Kickback","m":"glutes","sm":["hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"extension","i":"Kneel on the floor or an exercise mat and bend at the waist with your arms extended in front of you (perpendicular to the torso) in order to get into a kneeling push-up…","img":"Glute_Kickback"},{"n":"Goblet Squat","m":"quads","sm":["calves","glutes","hamstrings","shoulders"],"eq":"Kettlebell","lv":"B","mech":"C","a":"squat","i":"Stand holding a light kettlebell by the horns close to your chest.","img":"Goblet_Squat"},{"n":"Good Morning","m":"hamstrings","sm":["abs","glutes","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Begin with a bar on a rack at shoulder height.","img":"Good_Morning"},{"n":"Good Morning off Pins","m":"hamstrings","sm":["abs","glutes","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Begin with a bar on a rack at about the same height as your stomach.","img":"Good_Morning_off_Pins"},{"n":"Gorilla Chin/Crunch","m":"abs","sm":["biceps","back"],"eq":"Bodyweight","lv":"I","mech":"C","a":"ab","i":"Hang from a chin-up bar using an underhand grip (palms facing you) that is slightly wider than shoulder width.","img":"Gorilla_Chin_Crunch"},{"n":"Hack Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"B","mech":"C","a":"squat","i":"Place the back of your torso against the back pad of the machine and hook your shoulders under the shoulder pads provided.","img":"Hack_Squat"},{"n":"Hammer Curls","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Stand up with your torso upright and a dumbbell on each hand being held at arms length.","img":"Hammer_Curls"},{"n":"Hammer Grip Incline DB Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"presshoriz","i":"Lie back on an incline bench with a dumbbell on each hand on top of your thighs.","img":"Hammer_Grip_Incline_DB_Bench_Press"},{"n":"Handstand Push-Ups","m":"shoulders","sm":["triceps"],"eq":"Bodyweight","lv":"E","mech":"C","a":"presshoriz","i":"With your back to the wall bend at the waist and place both hands on the floor at shoulder width.","img":"Handstand_Push-Ups"},{"n":"Hang Clean","m":"quads","sm":["calves","forearms","glutes","hamstrings","lowerback","shoulders","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Begin with a shoulder width, double overhand or hook grip, with the bar hanging at the mid thigh position.","img":"Hang_Clean"},{"n":"Hang Clean - Below the Knees","m":"quads","sm":["calves","forearms","glutes","hamstrings","lowerback","shoulders","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Begin with a shoulder width, double overhand or hook grip, with the bar hanging just below the knees.","img":"Hang_Clean_-_Below_the_Knees"},{"n":"Hang Snatch","m":"hamstrings","sm":["abs","calves","forearms","glutes","lowerback","quads","shoulders","traps"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"Begin with a wide grip on the bar, with an overhand or hook grip.","img":"Hang_Snatch"},{"n":"Hang Snatch - Below Knees","m":"hamstrings","sm":["abs","calves","forearms","glutes","lowerback","quads","shoulders","traps"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"Begin with a wide grip on the bar, with an overhand or hook grip.","img":"Hang_Snatch_-_Below_Knees"},{"n":"Hanging Bar Good Morning","m":"hamstrings","sm":["abs","glutes","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Begin with a bar on a rack at about the same height as your stomach.","img":"Hanging_Bar_Good_Morning"},{"n":"Hanging Leg Raise","m":"abs","sm":[],"eq":"Bodyweight","lv":"E","mech":"I","a":"ab","i":"Hang from a chin-up bar with both arms extended at arms length in top of you using either a wide grip or a medium grip.","img":"Hanging_Leg_Raise"},{"n":"Hanging Pike","m":"abs","sm":[],"eq":"Bodyweight","lv":"E","mech":"C","a":"ab","i":"Hang from a chin-up bar with your legs and feet together using an overhand grip (palms facing away from you) that is slightly wider than shoulder width.","img":"Hanging_Pike"},{"n":"Heaving Snatch Balance","m":"quads","sm":["abs","forearms","glutes","hamstrings","shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"This drill helps you learn the snatch.","img":"Heaving_Snatch_Balance"},{"n":"High Cable Curls","m":"biceps","sm":[],"eq":"Cable","lv":"I","mech":"C","a":"curl","i":"Stand between a couple of high pulleys and grab a handle in each arm.","img":"High_Cable_Curls"},{"n":"Hip Extension with Bands","m":"glutes","sm":["hamstrings"],"eq":"Band","lv":"B","mech":"C","a":"hipthrust","i":"Secure one end of the band to the lower portion of a post and attach the other to one ankle.","img":"Hip_Extension_with_Bands"},{"n":"Hip Flexion with Band","m":"quads","sm":[],"eq":"Band","lv":"B","mech":"C","a":"squat","i":"Secure one end of the band to the lower portion of a post and attach the other to one ankle. Face away from the attachment point of the band.","img":"Hip_Flexion_with_Band"},{"n":"Hip Lift with Band","m":"glutes","sm":["calves","hamstrings"],"eq":"Band","lv":"B","mech":"C","a":"hipthrust","i":"After choosing a suitable band, lay down in the middle of the rack, after securing the band on either side of you.","img":"Hip_Lift_with_Band"},{"n":"Hyperextensions With No Hyperextension Bench","m":"lowerback","sm":["glutes","hamstrings"],"eq":"Bodyweight","lv":"I","mech":"C","a":"presshoriz","i":"With someone holding down your legs, slide yourself down to the edge a flat bench until your hips hang off the end of the bench.","img":"Hyperextensions_With_No_Hyperextension_Bench"},{"n":"Incline Barbell Triceps Extension","m":"triceps","sm":["forearms"],"eq":"Barbell","lv":"I","mech":"I","a":"extension","i":"Hold a barbell with an overhand grip (palms down) that is a little closer together than shoulder width.","img":"Incline_Barbell_Triceps_Extension"},{"n":"Incline Bench Pull","m":"back","sm":["back","shoulders"],"eq":"Barbell","lv":"B","mech":"I","a":"presshoriz","i":"Grab a dumbbell in each hand and lie face down on an incline bench that is set to an incline that is approximately 30 degrees.","img":"Incline_Bench_Pull"},{"n":"Incline Cable Chest Press","m":"chest","sm":["shoulders","triceps"],"eq":"Cable","lv":"B","mech":"C","a":"presshoriz","i":"Adjust the weight to an appropriate amount and be seated, grasping the handles.","img":"Incline_Cable_Chest_Press"},{"n":"Incline Cable Flye","m":"chest","sm":["shoulders"],"eq":"Cable","lv":"I","mech":"I","a":"fly","i":"To get yourself into the starting position, set the pulleys at the floor level (lowest level possible on the machine that is below your torso).","img":"Incline_Cable_Flye"},{"n":"Incline Dumbbell Bench With Palms Facing In","m":"chest","sm":["shoulders","triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"presshoriz","i":"Lie back on an incline bench with a dumbbell on each hand on top of your thighs.","img":"Incline_Dumbbell_Bench_With_Palms_Facing_In"},{"n":"Incline Dumbbell Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Sit back on an incline bench with a dumbbell in each hand held at arms length.","img":"Incline_Dumbbell_Curl"},{"n":"Incline Dumbbell Flyes","m":"chest","sm":["shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"fly","i":"Hold a dumbbell on each hand and lie on an incline bench that is set to an incline angle of no more than 30 degrees.","img":"Incline_Dumbbell_Flyes"},{"n":"Incline Dumbbell Flyes - With A Twist","m":"chest","sm":["shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"fly","i":"Hold a dumbbell in each hand and lie on an incline bench that is set to an incline angle of no more than 30 degrees.","img":"Incline_Dumbbell_Flyes_-_With_A_Twist"},{"n":"Incline Dumbbell Press","m":"chest","sm":["shoulders","triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"presshoriz","i":"Lie back on an incline bench with a dumbbell in each hand atop your thighs.","img":"Incline_Dumbbell_Press"},{"n":"Incline Hammer Curls","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Seat yourself on an incline bench with a dumbbell in each hand.","img":"Incline_Hammer_Curls"},{"n":"Incline Inner Biceps Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Hold a dumbbell in each hand and lie back on an incline bench.","img":"Incline_Inner_Biceps_Curl"},{"n":"Incline Push-Up","m":"chest","sm":["shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Stand facing bench or sturdy elevated platform.","img":"Incline_Push-Up"},{"n":"Incline Push-Up Close-Grip","m":"triceps","sm":["chest","shoulders"],"eq":"Bodyweight","lv":"B","mech":"C","a":"extension","i":"Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height. Place your hands next to one another on the bar.","img":"Incline_Push-Up_Close-Grip"},{"n":"Incline Push-Up Medium","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height. Place your hands on the bar, with your hands about shoulder width apart.","img":"Incline_Push-Up_Medium"},{"n":"Incline Push-Up Reverse Grip","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height. Place your hands on the bar palms up, with your hands about shoulder width apart.","img":"Incline_Push-Up_Reverse_Grip"},{"n":"Incline Push-Up Wide","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Stand facing a Smith machine bar or sturdy elevated platform at an appropriate height. Place your hands on the bar, with your hands wider than shoulder width.","img":"Incline_Push-Up_Wide"},{"n":"Internal Rotation with Band","m":"shoulders","sm":[],"eq":"Band","lv":"B","mech":"I","a":"pressvert","i":"Choke the band around a post.","img":"Internal_Rotation_with_Band"},{"n":"Iron Cross","m":"shoulders","sm":["chest","glutes","hamstrings","lowerback","quads","traps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"pressvert","i":"","img":"Iron_Cross"},{"n":"Isometric Chest Squeezes","m":"chest","sm":["shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"While either seating or standing, bend your arms at a 90-degree angle and place the palms of your hands together in front of your chest.","img":"Isometric_Chest_Squeezes"},{"n":"Isometric Neck Exercise - Front And Back","m":"traps","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"generic","i":"With your head and neck in a neutral position (normal position with head erect facing forward), place both of your hands on the front side of your head.","img":"Isometric_Neck_Exercise_-_Front_And_Back"},{"n":"Isometric Neck Exercise - Sides","m":"traps","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"generic","i":"With your head and neck in a neutral position (normal position with head erect facing forward), place your left hand on the left side of your head.","img":"Isometric_Neck_Exercise_-_Sides"},{"n":"Isometric Wipers","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Assume a push-up position, supporting your weight on your hands and toes while keeping your body straight.","img":"Isometric_Wipers"},{"n":"JM Press","m":"triceps","sm":["chest","shoulders"],"eq":"Barbell","lv":"B","mech":"C","a":"extension","i":"Start the exercise the same way you would a close grip bench press.","img":"JM_Press"},{"n":"Jackknife Sit-Up","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Lie flat on the floor (or exercise mat) on your back with your arms extended straight back behind your head and your legs extended also.","img":"Jackknife_Sit-Up"},{"n":"Janda Sit-Up","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Position your body on the floor in the basic sit-up position; knees to a ninety degree angle with feet flat on the floor and arms either crossed over your chest or to the sides.","img":"Janda_Sit-Up"},{"n":"Jefferson Squats","m":"quads","sm":["calves","glutes","hamstrings","lowerback","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Place a barbell on the floor. Stand in the middle of the bar length wise.","img":"Jefferson_Squats"},{"n":"Jerk Balance","m":"shoulders","sm":["glutes","hamstrings","quads","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"This drill helps you learn to drive yourself low enough during the jerk and corrects those who move backward during the movement.","img":"Jerk_Balance"},{"n":"Jerk Dip Squat","m":"quads","sm":["abs","calves"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"This movement strengthens the dip portion of the jerk.","img":"Jerk_Dip_Squat"},{"n":"Kettlebell Arnold Press","m":"shoulders","sm":["triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean a kettlebell to your shoulder.","img":"Kettlebell_Arnold_Press"},{"n":"Kettlebell Dead Clean","m":"hamstrings","sm":["calves","glutes","lowerback","quads","traps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"Place kettlebell between your feet.","img":"Kettlebell_Dead_Clean"},{"n":"Kettlebell Figure 8","m":"abs","sm":["hamstrings","shoulders"],"eq":"Kettlebell","lv":"I","mech":"C","a":"ab","i":"Place one kettlebell between your legs and take a wider than shoulder width stance.","img":"Kettlebell_Figure_8"},{"n":"Kettlebell Hang Clean","m":"hamstrings","sm":["calves","glutes","lowerback","shoulders","traps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"Place kettlebell between your feet.","img":"Kettlebell_Hang_Clean"},{"n":"Kettlebell One-Legged Deadlift","m":"hamstrings","sm":["glutes","lowerback"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"Hold a kettlebell by the handle in one hand.","img":"Kettlebell_One-Legged_Deadlift"},{"n":"Kettlebell Pass Between The Legs","m":"abs","sm":["glutes","hamstrings","shoulders"],"eq":"Kettlebell","lv":"I","mech":"C","a":"ab","i":"Place one kettlebell between your legs and take a comfortable stance.","img":"Kettlebell_Pass_Between_The_Legs"},{"n":"Kettlebell Pirate Ships","m":"shoulders","sm":["abs"],"eq":"Kettlebell","lv":"B","mech":"C","a":"pressvert","i":"With a wide stance, hold a kettlebell with both hands.","img":"Kettlebell_Pirate_Ships"},{"n":"Kettlebell Pistol Squat","m":"quads","sm":["calves","glutes","hamstrings","shoulders"],"eq":"Kettlebell","lv":"E","mech":"C","a":"squat","i":"Pick up a kettlebell with two hands and hold it by the horns.","img":"Kettlebell_Pistol_Squat"},{"n":"Kettlebell Seated Press","m":"shoulders","sm":["triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Sit on the floor and spread your legs out comfortably. Clean one kettlebell to your shoulder.","img":"Kettlebell_Seated_Press"},{"n":"Kettlebell Seesaw Press","m":"shoulders","sm":["triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean two kettlebells two your shoulders. Press one kettlebell.","img":"Kettlebell_Seesaw_Press"},{"n":"Kettlebell Sumo High Pull","m":"traps","sm":["quads","glutes","hamstrings","quads","shoulders"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"Place a kettlebell on the ground between your feet.","img":"Kettlebell_Sumo_High_Pull"},{"n":"Kettlebell Thruster","m":"shoulders","sm":["quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean two kettlebells to your shoulders.","img":"Kettlebell_Thruster"},{"n":"Kettlebell Turkish Get-Up (Lunge style)","m":"shoulders","sm":["abs","hamstrings","quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"lunge","i":"Lie on your back on the floor and press a kettlebell to the top position by extending the elbow.","img":"Kettlebell_Turkish_Get-Up_Lunge_style"},{"n":"Kettlebell Turkish Get-Up (Squat style)","m":"shoulders","sm":["abs","calves","hamstrings","quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"squat","i":"Lie on your back on the floor and press a kettlebell to the top position by extending the elbow.","img":"Kettlebell_Turkish_Get-Up_Squat_style"},{"n":"Kettlebell Windmill","m":"abs","sm":["glutes","hamstrings","shoulders","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"ab","i":"Place a kettlebell in front of your lead foot and clean and press it overhead with your opposite arm.","img":"Kettlebell_Windmill"},{"n":"Knee Tuck Jump","m":"hamstrings","sm":["glutes","quads","calves","glutes","quads"],"eq":"Bodyweight","lv":"B","mech":"C","a":"hinge","i":"Begin in a comfortable standing position with your knees slightly bent.","img":"Knee_Tuck_Jump"},{"n":"Kneeling Cable Crunch With Alternating Oblique Twists","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Connect a rope attachment to a high pulley cable and position a mat on the floor in front of it.","img":"Kneeling_Cable_Crunch_With_Alternating_Oblique_Twists"},{"n":"Kneeling Cable Triceps Extension","m":"triceps","sm":[],"eq":"Cable","lv":"I","mech":"I","a":"extension","i":"Place a bench sideways in front of a high pulley machine. Hold a straight bar attachment above your head with your hands about 6 inches apart with your palms facing down.","img":"Kneeling_Cable_Triceps_Extension"},{"n":"Kneeling High Pulley Row","m":"back","sm":["biceps","back"],"eq":"Cable","lv":"B","mech":"C","a":"pullhoriz","i":"Select the appropriate weight using a pulley that is above your head.","img":"Kneeling_High_Pulley_Row"},{"n":"Kneeling Jump Squat","m":"glutes","sm":["calves","hamstrings","quads"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Begin kneeling on the floor with a barbell racked across the back of your shoulders, or you can use your body weight for this exercise.","img":"Kneeling_Jump_Squat"},{"n":"Kneeling Single-Arm High Pulley Row","m":"back","sm":["biceps","back"],"eq":"Cable","lv":"B","mech":"C","a":"pullhoriz","i":"Attach a single handle to a high pulley and make your weight selection.","img":"Kneeling_Single-Arm_High_Pulley_Row"},{"n":"Kneeling Squat","m":"glutes","sm":["abs","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Set the bar to the proper height in a power rack.","img":"Kneeling_Squat"},{"n":"Landmine 180's","m":"abs","sm":["glutes","lowerback","shoulders"],"eq":"Barbell","lv":"B","mech":"C","a":"ab","i":"Position a bar into a landmine or securely anchor it in a corner.","img":"Landmine_180s"},{"n":"Landmine Linear Jammer","m":"shoulders","sm":["abs","calves","chest","hamstrings","quads","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"Position a bar into landmine or, lacking one, securely anchor it in a corner.","img":"Landmine_Linear_Jammer"},{"n":"Lateral Bound","m":"quads","sm":["glutes","calves","glutes","hamstrings","quads"],"eq":"Bodyweight","lv":"B","mech":"C","a":"generic","i":"Assume a half squat position facing 90 degrees from your direction of travel.","img":"Lateral_Bound"},{"n":"Lateral Raise - With Bands","m":"shoulders","sm":[],"eq":"Band","lv":"B","mech":"I","a":"lateralraise","i":"To begin, stand on an exercise band so that tension begins at arm's length.","img":"Lateral_Raise_-_With_Bands"},{"n":"Leg-Over Floor Press","m":"chest","sm":["shoulders","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"presshoriz","i":"Lie on the floor with one kettlebell in place on your chest, holding it by the handle.","img":"Leg-Over_Floor_Press"},{"n":"Leg Extensions","m":"quads","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"legext","i":"For this exercise you will need to use a leg extension machine.","img":"Leg_Extensions"},{"n":"Leg Lift","m":"glutes","sm":["hamstrings"],"eq":"Bodyweight","lv":"B","mech":"I","a":"hipthrust","i":"While standing up straight with both feet next to each other at around shoulder width, grab a sturdy surface such as the sides of a squat rack or the top of a chair to…","img":"Leg_Lift"},{"n":"Leg Press","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"B","mech":"C","a":"squat","i":"Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a medium (shoulder width) foot stance.","img":"Leg_Press"},{"n":"Leg Pull-In","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Lie on an exercise mat with your legs extended and your hands either palms facing down next to you or under your glutes.","img":"Leg_Pull-In"},{"n":"Leverage Chest Press","m":"chest","sm":["shoulders","triceps"],"eq":"Machine","lv":"B","mech":"C","a":"presshoriz","i":"Load an appropriate weight onto the pins and adjust the seat for your height.","img":"Leverage_Chest_Press"},{"n":"Leverage Deadlift","m":"quads","sm":["glutes","hamstrings"],"eq":"Machine","lv":"B","mech":"C","a":"hinge","i":"Load the pins to an appropriate weight.","img":"Leverage_Deadlift"},{"n":"Leverage Decline Chest Press","m":"chest","sm":["shoulders","triceps"],"eq":"Machine","lv":"B","mech":"C","a":"presshoriz","i":"Load an appropriate weight onto the pins and adjust the seat for your height.","img":"Leverage_Decline_Chest_Press"},{"n":"Leverage High Row","m":"back","sm":["back"],"eq":"Machine","lv":"B","mech":"C","a":"pullhoriz","i":"Load an appropriate weight onto the pins and adjust the seat height so that you can just reach the handles above you.","img":"Leverage_High_Row"},{"n":"Leverage Incline Chest Press","m":"chest","sm":["shoulders","triceps"],"eq":"Machine","lv":"B","mech":"C","a":"presshoriz","i":"Load an appropriate weight onto the pins and adjust the seat for your height.","img":"Leverage_Incline_Chest_Press"},{"n":"Leverage Iso Row","m":"back","sm":["biceps","back"],"eq":"Machine","lv":"B","mech":"C","a":"pullhoriz","i":"Load an appropriate weight onto the pins and adjust the seat height so that the handles are at chest level.","img":"Leverage_Iso_Row"},{"n":"Leverage Shoulder Press","m":"shoulders","sm":["triceps"],"eq":"Machine","lv":"B","mech":"C","a":"pressvert","i":"Load an appropriate weight onto the pins and adjust the seat for your height.","img":"Leverage_Shoulder_Press"},{"n":"Leverage Shrug","m":"traps","sm":["forearms"],"eq":"Machine","lv":"B","mech":"I","a":"shrug","i":"Load the pins to an appropriate weight.","img":"Leverage_Shrug"},{"n":"Low Cable Crossover","m":"chest","sm":["shoulders"],"eq":"Cable","lv":"B","mech":"I","a":"fly","i":"To move into the starting position, place the pulleys at the low position, select the resistance to be used and grasp a handle in each hand.","img":"Low_Cable_Crossover"},{"n":"Low Cable Triceps Extension","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Select the desired weight and lay down face up on the bench of a seated row machine that has a rope attached to it.","img":"Low_Cable_Triceps_Extension"},{"n":"Low Pulley Row To Neck","m":"shoulders","sm":["biceps","back","traps"],"eq":"Cable","lv":"B","mech":"C","a":"pullhoriz","i":"Sit on a low pulley row machine with a rope attachment.","img":"Low_Pulley_Row_To_Neck"},{"n":"Lunge Pass Through","m":"hamstrings","sm":["calves","glutes","quads"],"eq":"Kettlebell","lv":"I","mech":"C","a":"lunge","i":"Stand with your torso upright holding a kettlebell in your right hand.","img":"Lunge_Pass_Through"},{"n":"Lunge Sprint","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"I","mech":"C","a":"lunge","i":"Adjust a bar in a Smith machine to an appropriate height.","img":"Lunge_Sprint"},{"n":"Lying Cable Curl","m":"biceps","sm":[],"eq":"Cable","lv":"I","mech":"I","a":"curl","i":"Grab a straight bar or E-Z bar attachment that is attached to the low pulley with both hands, using an underhand (palms facing up) shoulder-width grip.","img":"Lying_Cable_Curl"},{"n":"Lying Cambered Barbell Row","m":"back","sm":["biceps","back","traps"],"eq":"Barbell","lv":"B","mech":"I","a":"pullhoriz","i":"Place a cambered bar underneath an exercise bench.","img":"Lying_Cambered_Barbell_Row"},{"n":"Lying Close-Grip Bar Curl On High Pulley","m":"biceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"curl","i":"Place a flat bench in front of a high pulley or lat pulldown machine. Hold the straight bar attachment using an underhand grip (palms up) that is about shoulder width.","img":"Lying_Close-Grip_Bar_Curl_On_High_Pulley"},{"n":"Lying Close-Grip Barbell Triceps Extension Behind The Head","m":"triceps","sm":[],"eq":"Barbell","lv":"I","mech":"I","a":"extension","i":"While holding a barbell or EZ Curl bar with a pronated grip (palms facing forward), lie on your back on a flat bench with your head close to the end of the bench.","img":"Lying_Close-Grip_Barbell_Triceps_Extension_Behind_The_Head"},{"n":"Lying Close-Grip Barbell Triceps Press To Chin","m":"triceps","sm":[],"eq":"EZ Bar","lv":"I","mech":"I","a":"extension","i":"While holding a barbell or EZ Curl bar with a pronated grip (palms facing forward), lie on your back on a flat bench with your head off the end of the bench.","img":"Lying_Close-Grip_Barbell_Triceps_Press_To_Chin"},{"n":"Lying Dumbbell Tricep Extension","m":"triceps","sm":["chest","shoulders"],"eq":"Dumbbell","lv":"I","mech":"I","a":"extension","i":"Lie on a flat bench while holding two dumbbells directly in front of you.","img":"Lying_Dumbbell_Tricep_Extension"},{"n":"Lying High Bench Barbell Curl","m":"biceps","sm":[],"eq":"Barbell","lv":"I","mech":"I","a":"curl","i":"Lie face forward on a tall flat bench while holding a barbell with a supinated grip (palms facing up).","img":"Lying_High_Bench_Barbell_Curl"},{"n":"Lying Leg Curls","m":"hamstrings","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"legcurl","i":"Adjust the machine lever to fit your height and lie face down on the leg curl machine with the pad of the lever on the back of your legs (just a few inches under the calves).","img":"Lying_Leg_Curls"},{"n":"Lying Machine Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"I","mech":"C","a":"squat","i":"Adjust the leg machine to a height that will allow you to get inside it with your knees bent and the thighs slightly below parallel.","img":"Lying_Machine_Squat"},{"n":"Lying One-Arm Lateral Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"lateralraise","i":"While holding a dumbbell in one hand, lay with your chest down on a flat bench.","img":"Lying_One-Arm_Lateral_Raise"},{"n":"Lying Rear Delt Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"rearfly","i":"While holding a dumbbell in each hand, lay with your chest down on a flat bench.","img":"Lying_Rear_Delt_Raise"},{"n":"Lying Supine Dumbbell Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Lie down on a flat bench face up while holding a dumbbell in each arm on top of your thighs.","img":"Lying_Supine_Dumbbell_Curl"},{"n":"Lying T-Bar Row","m":"back","sm":["biceps","back"],"eq":"Machine","lv":"I","mech":"C","a":"pullhoriz","i":"Load up the T-bar Row Machine with the desired weight and adjust the leg height so that your upper chest is at the top of the pad.","img":"Lying_T-Bar_Row"},{"n":"Lying Triceps Press","m":"triceps","sm":[],"eq":"EZ Bar","lv":"I","mech":"I","a":"extension","i":"Lie on a flat bench with either an e-z bar (my preference) or a straight bar placed on the floor behind your head and your feet on the floor.","img":"Lying_Triceps_Press"},{"n":"Machine Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Machine","lv":"B","mech":"C","a":"presshoriz","i":"Sit down on the Chest Press Machine and select the weight.","img":"Machine_Bench_Press"},{"n":"Machine Bicep Curl","m":"biceps","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"curl","i":"Adjust the seat to the appropriate height and make your weight selection.","img":"Machine_Bicep_Curl"},{"n":"Machine Preacher Curls","m":"biceps","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"curl","i":"Sit down on the Preacher Curl Machine and select the weight.","img":"Machine_Preacher_Curls"},{"n":"Machine Shoulder (Military) Press","m":"shoulders","sm":["triceps"],"eq":"Machine","lv":"B","mech":"C","a":"pressvert","i":"Sit down on the Shoulder Press Machine and select the weight.","img":"Machine_Shoulder_Military_Press"},{"n":"Machine Triceps Extension","m":"triceps","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"extension","i":"Adjust the seat to the appropriate height and make your weight selection.","img":"Machine_Triceps_Extension"},{"n":"Medicine Ball Chest Pass","m":"chest","sm":["shoulders","triceps"],"eq":"Med Ball","lv":"B","mech":"C","a":"presshoriz","i":"You will need a partner for this exercise.","img":"Medicine_Ball_Chest_Pass"},{"n":"Medicine Ball Full Twist","m":"abs","sm":["shoulders"],"eq":"Med Ball","lv":"B","mech":"C","a":"ab","i":"For this exercise you will need a medicine ball and a partner.","img":"Medicine_Ball_Full_Twist"},{"n":"Medicine Ball Scoop Throw","m":"shoulders","sm":["abs","hamstrings","quads"],"eq":"Med Ball","lv":"B","mech":"C","a":"pullhoriz","i":"Assume a semisquat stance with a medicine ball in your hands.","img":"Medicine_Ball_Scoop_Throw"},{"n":"Middle Back Shrug","m":"back","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"shrug","i":"Lie facedown on an incline bench while holding a dumbbell in each hand.","img":"Middle_Back_Shrug"},{"n":"Monster Walk","m":"glutes","sm":[],"eq":"Band","lv":"B","mech":"C","a":"generic","i":"Place a band around both ankles and another around both knees.","img":"Monster_Walk"},{"n":"Muscle Snatch","m":"hamstrings","sm":["glutes","lowerback","quads","shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Begin with a loaded barbell held at the mid thigh position with a wide grip.","img":"Muscle_Snatch"},{"n":"Narrow Stance Hack Squats","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"I","mech":"C","a":"squat","i":"Place the back of your torso against the back pad of the machine and hook your shoulders under the shoulder pads provided.","img":"Narrow_Stance_Hack_Squats"},{"n":"Narrow Stance Leg Press","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"I","mech":"C","a":"pullhoriz","i":"Using a leg press machine, sit down on the machine and place your legs on the platform directly in front of you at a less-than-shoulder-width narrow stance with the toes…","img":"Narrow_Stance_Leg_Press"},{"n":"Narrow Stance Squats","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Narrow_Stance_Squats"},{"n":"Natural Glute Ham Raise","m":"hamstrings","sm":["calves","glutes","lowerback"],"eq":"Bodyweight","lv":"I","mech":"C","a":"hinge","i":"Using the leg pad of a lat pulldown machine or a preacher bench, position yourself so that your ankles are under the pads, knees on the seat, and you are facing away from the machine.","img":"Natural_Glute_Ham_Raise"},{"n":"Neck Press","m":"chest","sm":["shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Lie back on a flat bench.","img":"Neck_Press"},{"n":"Oblique Crunches","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Lie flat on the floor with your lower back pressed to the ground.","img":"Oblique_Crunches"},{"n":"Oblique Crunches - On The Floor","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Start out by lying on your right side with your legs lying on top of each other. Make sure your knees are bent a little bit. Place your left hand behind your head.","img":"Oblique_Crunches_-_On_The_Floor"},{"n":"Olympic Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Begin with a barbell supported on top of the traps.","img":"Olympic_Squat"},{"n":"One-Arm Dumbbell Row","m":"back","sm":["biceps","back","shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pullhoriz","i":"Choose a flat bench and place a dumbbell on each side of it.","img":"One-Arm_Dumbbell_Row"},{"n":"One-Arm Flat Bench Dumbbell Flye","m":"chest","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"fly","i":"Lie down on a flat bench with a dumbbell in one hand resting on top of your thigh.","img":"One-Arm_Flat_Bench_Dumbbell_Flye"},{"n":"One-Arm High-Pulley Cable Side Bends","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Connect a standard handle to a tower. Move cable to highest pulley position. Stand with side to cable. With one hand, reach up and grab handle with underhand grip.","img":"One-Arm_High-Pulley_Cable_Side_Bends"},{"n":"One-Arm Incline Lateral Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"lateralraise","i":"Lie down sideways on an incline bench press with a dumbbell in the hand.","img":"One-Arm_Incline_Lateral_Raise"},{"n":"One-Arm Kettlebell Clean","m":"hamstrings","sm":["glutes","lowerback","shoulders","traps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"Place a kettlebell between your feet.","img":"One-Arm_Kettlebell_Clean"},{"n":"One-Arm Kettlebell Clean and Jerk","m":"shoulders","sm":[],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Hold a kettlebell by the handle.","img":"One-Arm_Kettlebell_Clean_and_Jerk"},{"n":"One-Arm Kettlebell Floor Press","m":"chest","sm":["triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"presshoriz","i":"Lie on the floor holding a kettlebell with one hand, with your upper arm supported by the floor.","img":"One-Arm_Kettlebell_Floor_Press"},{"n":"One-Arm Kettlebell Jerk","m":"shoulders","sm":["calves","quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Hold a kettlebell by the handle.","img":"One-Arm_Kettlebell_Jerk"},{"n":"One-Arm Kettlebell Military Press To The Side","m":"shoulders","sm":["triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean a kettlebell to your shoulder.","img":"One-Arm_Kettlebell_Military_Press_To_The_Side"},{"n":"One-Arm Kettlebell Para Press","m":"shoulders","sm":["triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean a kettlebell to your shoulder.","img":"One-Arm_Kettlebell_Para_Press"},{"n":"One-Arm Kettlebell Push Press","m":"shoulders","sm":["calves","quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Hold a kettlebell by the handle.","img":"One-Arm_Kettlebell_Push_Press"},{"n":"One-Arm Kettlebell Row","m":"back","sm":["biceps","back"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pullhoriz","i":"Place a kettlebell in front of your feet.","img":"One-Arm_Kettlebell_Row"},{"n":"One-Arm Kettlebell Snatch","m":"shoulders","sm":["calves","glutes","hamstrings","lowerback","traps","triceps"],"eq":"Kettlebell","lv":"E","mech":"C","a":"pressvert","i":"Place a kettlebell between your feet.","img":"One-Arm_Kettlebell_Snatch"},{"n":"One-Arm Kettlebell Split Jerk","m":"shoulders","sm":["glutes","hamstrings","quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Hold a kettlebell by the handle.","img":"One-Arm_Kettlebell_Split_Jerk"},{"n":"One-Arm Kettlebell Split Snatch","m":"shoulders","sm":["hamstrings","quads"],"eq":"Kettlebell","lv":"E","mech":"C","a":"pressvert","i":"Hold a kettlebell in one hand by the handle.","img":"One-Arm_Kettlebell_Split_Snatch"},{"n":"One-Arm Kettlebell Swings","m":"hamstrings","sm":["calves","glutes","lowerback","shoulders"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"","img":"One-Arm_Kettlebell_Swings"},{"n":"One-Arm Long Bar Row","m":"back","sm":["biceps","back"],"eq":"Barbell","lv":"B","mech":"C","a":"pullhoriz","i":"Position a bar into a landmine or in a corner to keep it from moving.","img":"One-Arm_Long_Bar_Row"},{"n":"One-Arm Medicine Ball Slam","m":"abs","sm":["back","shoulders"],"eq":"Med Ball","lv":"B","mech":"C","a":"ab","i":"Start in a standing position with a staggered, athletic stance.","img":"One-Arm_Medicine_Ball_Slam"},{"n":"One-Arm Open Palm Kettlebell Clean","m":"hamstrings","sm":["forearms","glutes","lowerback","quads","shoulders"],"eq":"Kettlebell","lv":"I","mech":"C","a":"hinge","i":"Place one kettlebell between your feet.","img":"One-Arm_Open_Palm_Kettlebell_Clean"},{"n":"One-Arm Overhead Kettlebell Squats","m":"quads","sm":["calves","glutes","hamstrings","shoulders"],"eq":"Kettlebell","lv":"E","mech":"C","a":"squat","i":"Clean and press a kettlebell with one arm.","img":"One-Arm_Overhead_Kettlebell_Squats"},{"n":"One-Arm Side Deadlift","m":"quads","sm":["abs","calves","glutes","hamstrings","lowerback","traps"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"Stand to the side of a barbell next to its center.","img":"One-Arm_Side_Deadlift"},{"n":"One-Arm Side Laterals","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"lateralraise","i":"Pick a dumbbell and place it in one of your hands.","img":"One-Arm_Side_Laterals"},{"n":"One-Legged Cable Kickback","m":"glutes","sm":["hamstrings"],"eq":"Cable","lv":"I","mech":"I","a":"extension","i":"Hook a leather ankle cuff to a low cable pulley and then attach the cuff to your ankle.","img":"One-Legged_Cable_Kickback"},{"n":"One Arm Dumbbell Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"presshoriz","i":"Lie down on a flat bench with a dumbbell in one hand on top of your thigh.","img":"One_Arm_Dumbbell_Bench_Press"},{"n":"One Arm Dumbbell Preacher Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Grab a dumbbell with the right arm and place the upper arm on top of the preacher bench or the incline bench.","img":"One_Arm_Dumbbell_Preacher_Curl"},{"n":"One Arm Floor Press","m":"triceps","sm":["chest","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Lie down on a flat surface with your back pressing against the floor or an exercise mat.","img":"One_Arm_Floor_Press"},{"n":"One Arm Lat Pulldown","m":"back","sm":["biceps","back"],"eq":"Cable","lv":"B","mech":"C","a":"pullvert","i":"Select an appropriate weight and adjust the knee pad to help keep you down.","img":"One_Arm_Lat_Pulldown"},{"n":"One Arm Pronated Dumbbell Triceps Extension","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"Lie flat on a bench while holding a dumbbell at arms length.","img":"One_Arm_Pronated_Dumbbell_Triceps_Extension"},{"n":"One Arm Supinated Dumbbell Triceps Extension","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"Lie flat on a bench while holding a dumbbell at arms length.","img":"One_Arm_Supinated_Dumbbell_Triceps_Extension"},{"n":"One Leg Barbell Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Start by standing about 2 to 3 feet in front of a flat bench with your back facing the bench.","img":"One_Leg_Barbell_Squat"},{"n":"Open Palm Kettlebell Clean","m":"hamstrings","sm":["glutes","lowerback","quads","shoulders"],"eq":"Kettlebell","lv":"E","mech":"C","a":"hinge","i":"Place one kettlebell between your feet.","img":"Open_Palm_Kettlebell_Clean"},{"n":"Overhead Cable Curl","m":"biceps","sm":[],"eq":"Cable","lv":"I","mech":"I","a":"curl","i":"To begin, set a weight that is comfortable on each side of the pulley machine.","img":"Overhead_Cable_Curl"},{"n":"Overhead Slam","m":"back","sm":[],"eq":"Med Ball","lv":"B","mech":"C","a":"pullhoriz","i":"Hold a medine ball with both hands and stand with your feet at shoulder width.","img":"Overhead_Slam"},{"n":"Overhead Squat","m":"quads","sm":["abs","calves","glutes","hamstrings","lowerback","shoulders","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Start out by having a barbell in front of you on the floor.","img":"Overhead_Squat"},{"n":"Pallof Press","m":"abs","sm":["chest","shoulders","triceps"],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Connect a standard handle to a tower, and—if possible—position the cable to shoulder height.","img":"Pallof_Press"},{"n":"Pallof Press With Rotation","m":"abs","sm":["chest","shoulders","triceps"],"eq":"Cable","lv":"B","mech":"C","a":"ab","i":"Connect a standard handle to a tower, and position the cable to shoulder height.","img":"Pallof_Press_With_Rotation"},{"n":"Palms-Down Dumbbell Wrist Curl Over A Bench","m":"forearms","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Start out by placing two dumbbells on one side of a flat bench. Kneel down on both of your knees so that your body is facing the flat bench.","img":"Palms-Down_Dumbbell_Wrist_Curl_Over_A_Bench"},{"n":"Palms-Down Wrist Curl Over A Bench","m":"forearms","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Start out by placing a barbell on one side of a flat bench. Kneel down on both of your knees so that your body is facing the flat bench.","img":"Palms-Down_Wrist_Curl_Over_A_Bench"},{"n":"Palms-Up Barbell Wrist Curl Over A Bench","m":"forearms","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Start out by placing a barbell on one side of a flat bench. Kneel down on both of your knees so that your body is facing the flat bench.","img":"Palms-Up_Barbell_Wrist_Curl_Over_A_Bench"},{"n":"Palms-Up Dumbbell Wrist Curl Over A Bench","m":"forearms","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Start out by placing two dumbbells on one side of a flat bench. Kneel down on both of your knees so that your body is facing the flat bench.","img":"Palms-Up_Dumbbell_Wrist_Curl_Over_A_Bench"},{"n":"Pin Presses","m":"triceps","sm":["chest","forearms","back","back","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"extension","i":"Pin presses remove the eccentric phase of the bench press, developing starting strength.","img":"Pin_Presses"},{"n":"Plank","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Get into a prone position on the floor, supporting your weight on your toes and your forearms.","img":"Plank"},{"n":"Plie Dumbbell Squat","m":"quads","sm":["abs","calves","glutes","hamstrings"],"eq":"Dumbbell","lv":"B","mech":"C","a":"squat","i":"Hold a dumbbell at the base with both hands and stand straight up.","img":"Plie_Dumbbell_Squat"},{"n":"Plyo Kettlebell Pushups","m":"chest","sm":["shoulders","triceps"],"eq":"Kettlebell","lv":"E","mech":"C","a":"presshoriz","i":"Place a kettlebell on the floor.","img":"Plyo_Kettlebell_Pushups"},{"n":"Plyo Push-up","m":"chest","sm":["shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Move into a prone position on the floor, supporting your weight on your hands and toes.","img":"Plyo_Push-up"},{"n":"Power Clean","m":"hamstrings","sm":["calves","forearms","glutes","lowerback","back","quads","shoulders","traps","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Stand with your feet slightly wider than shoulder width apart and toes pointing out slightly.","img":"Power_Clean"},{"n":"Power Clean from Blocks","m":"hamstrings","sm":["quads"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"With a barbell on boxes of the desired height, take a grip just outside the legs.","img":"Power_Clean_from_Blocks"},{"n":"Power Jerk","m":"quads","sm":["abs","calves","glutes","hamstrings","shoulders","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Standing with the weight racked on the front of the shoulders, begin with the dip.","img":"Power_Jerk"},{"n":"Power Partials","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"Stand up with your torso upright and a dumbbell on each hand being held at arms length.","img":"Power_Partials"},{"n":"Power Snatch","m":"hamstrings","sm":["calves","glutes","lowerback","quads","shoulders","traps","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"Begin with a loaded barbell on the floor.","img":"Power_Snatch"},{"n":"Power Snatch from Blocks","m":"quads","sm":["calves","forearms","glutes","hamstrings","lowerback","shoulders","traps","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Begin with a loaded barbell on boxes or stands of the desired height.","img":"Power_Snatch_from_Blocks"},{"n":"Preacher Curl","m":"biceps","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"To perform this movement you will need a preacher bench and an E-Z bar.","img":"Preacher_Curl"},{"n":"Preacher Hammer Dumbbell Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Place the upper part of both arms on top of the preacher bench as you hold a dumbbell in each hand with the palms facing each other (neutral grip).","img":"Preacher_Hammer_Dumbbell_Curl"},{"n":"Press Sit-Up","m":"abs","sm":["chest","shoulders","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"ab","i":"To begin, lie down on a bench with a barbell resting on your chest.","img":"Press_Sit-Up"},{"n":"Pull Through","m":"glutes","sm":["hamstrings","lowerback"],"eq":"Cable","lv":"B","mech":"C","a":"hipthrust","i":"Begin standing a few feet in front of a low pulley with a rope or handle attached.","img":"Pull_Through"},{"n":"Pullups","m":"back","sm":["biceps","back"],"eq":"Bodyweight","lv":"B","mech":"C","a":"pullvert","i":"Grab the pull-up bar with the palms facing forward using the prescribed grip.","img":"Pullups"},{"n":"Push-Up Wide","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"With your hands wide apart, support your body on your toes and hands in a plank position.","img":"Push-Up_Wide"},{"n":"Push-Ups - Close Triceps Position","m":"triceps","sm":["chest","shoulders"],"eq":"Bodyweight","lv":"I","mech":"C","a":"presshoriz","i":"Lie on the floor face down and place your hands closer than shoulder width for a close hand position.","img":"Push-Ups_-_Close_Triceps_Position"},{"n":"Push-Ups With Feet Elevated","m":"chest","sm":["shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Lie on the floor face down and place your hands about 36 inches apart from each other holding your torso up at arms length.","img":"Push-Ups_With_Feet_Elevated"},{"n":"Push Press","m":"shoulders","sm":["quads","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"pressvert","i":"","img":"Push_Press"},{"n":"Push Press - Behind the Neck","m":"shoulders","sm":["calves","quads","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"Standing with the weight racked on the back of the shoulders, begin with the dip.","img":"Push_Press_-_Behind_the_Neck"},{"n":"Push Up to Side Plank","m":"chest","sm":["abs","shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Get into pushup position on the toes with your hands just outside of shoulder width.","img":"Push_Up_to_Side_Plank"},{"n":"Pushups","m":"chest","sm":["shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Lie on the floor face down and place your hands about 36 inches apart while holding your torso up at arms length.","img":"Pushups"},{"n":"Pushups (Close and Wide Hand Positions)","m":"chest","sm":["shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Lie on the floor face down and body straight with your toes on the floor and the hands wider than shoulder width for a wide hand position and closer than shoulder width…","img":"Pushups_Close_and_Wide_Hand_Positions"},{"n":"Rack Delivery","m":"shoulders","sm":["forearms","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"This drill teaches the delivery of the barbell to the rack position on the shoulders.","img":"Rack_Delivery"},{"n":"Rack Pull with Bands","m":"lowerback","sm":["forearms","glutes","hamstrings","quads","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Set up in a power rack with the bar on the pins.","img":"Rack_Pull_with_Bands"},{"n":"Rack Pulls","m":"lowerback","sm":["forearms","glutes","hamstrings","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Set up in a power rack with the bar on the pins.","img":"Rack_Pulls"},{"n":"Return Push from Stance","m":"shoulders","sm":["chest","triceps"],"eq":"Med Ball","lv":"B","mech":"C","a":"pressvert","i":"You will need a partner for this drill. Begin in an athletic 2 or 3 point stance.","img":"Return_Push_from_Stance"},{"n":"Reverse Band Bench Press","m":"triceps","sm":["chest","forearms","back","back","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Position a bench inside a power rack, with the bar set to the correct height.","img":"Reverse_Band_Bench_Press"},{"n":"Reverse Band Box Squat","m":"quads","sm":["glutes","quads","calves","forearms","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Begin in a power rack with a box at the appropriate height behind you.","img":"Reverse_Band_Box_Squat"},{"n":"Reverse Band Deadlift","m":"lowerback","sm":["glutes","quads","calves","glutes","hamstrings","quads"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"Set the bar up in a power rack.","img":"Reverse_Band_Deadlift"},{"n":"Reverse Band Power Squat","m":"quads","sm":["quads","calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Begin in a power rack with the pins and bar set at the appropriate height.","img":"Reverse_Band_Power_Squat"},{"n":"Reverse Band Sumo Deadlift","m":"hamstrings","sm":["glutes","quads","calves","forearms","glutes","lowerback","quads","traps"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"Begin with a bar loaded on the floor inside of a power rack.","img":"Reverse_Band_Sumo_Deadlift"},{"n":"Reverse Barbell Curl","m":"biceps","sm":["forearms"],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Stand up with your torso upright while holding a barbell at shoulder width with the elbows close to the torso.","img":"Reverse_Barbell_Curl"},{"n":"Reverse Barbell Preacher Curls","m":"biceps","sm":["forearms"],"eq":"EZ Bar","lv":"I","mech":"I","a":"curl","i":"Grab an EZ-bar using a shoulder width and palms down (pronated) grip.","img":"Reverse_Barbell_Preacher_Curls"},{"n":"Reverse Cable Curl","m":"biceps","sm":["forearms"],"eq":"Cable","lv":"B","mech":"I","a":"curl","i":"Stand up with your torso upright while holding a bar attachment that is attached to a low pulley using a pronated (palms down) and shoulder width grip.","img":"Reverse_Cable_Curl"},{"n":"Reverse Crunch","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Lie down on the floor with your legs fully extended and arms to the side of your torso with the palms on the floor.","img":"Reverse_Crunch"},{"n":"Reverse Flyes","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"rearfly","i":"To begin, lie down on an incline bench with the chest and stomach pressing against the incline.","img":"Reverse_Flyes"},{"n":"Reverse Flyes With External Rotation","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"rearfly","i":"To begin, lie down on an incline bench set at a 30-degree angle with the chest and stomach pressing against the incline.","img":"Reverse_Flyes_With_External_Rotation"},{"n":"Reverse Grip Bent-Over Rows","m":"back","sm":["biceps","back","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"pullhoriz","i":"Stand erect while holding a barbell with a supinated grip (palms facing up).","img":"Reverse_Grip_Bent-Over_Rows"},{"n":"Reverse Grip Triceps Pushdown","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Start by setting a bar attachment (straight or e-z) on a high pulley machine.","img":"Reverse_Grip_Triceps_Pushdown"},{"n":"Reverse Hyperextension","m":"hamstrings","sm":["calves","glutes"],"eq":"Machine","lv":"I","mech":"C","a":"hinge","i":"Place your feet between the pads after loading an appropriate weight.","img":"Reverse_Hyperextension"},{"n":"Reverse Machine Flyes","m":"shoulders","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"fly","i":"Adjust the handles so that they are fully to the rear.","img":"Reverse_Machine_Flyes"},{"n":"Reverse Triceps Bench Press","m":"triceps","sm":["chest","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Lie back on a flat bench.","img":"Reverse_Triceps_Bench_Press"},{"n":"Rocket Jump","m":"quads","sm":["calves","hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"Begin in a relaxed stance with your feet shoulder width apart and hold your arms close to the body.","img":"Rocket_Jump"},{"n":"Rocking Standing Calf Raise","m":"calves","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"calf","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Rocking_Standing_Calf_Raise"},{"n":"Romanian Deadlift","m":"hamstrings","sm":["calves","glutes","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Put a barbell in front of you on the ground and grab it using a pronated (palms facing down) grip that a little wider than shoulder width.","img":"Romanian_Deadlift"},{"n":"Romanian Deadlift from Deficit","m":"hamstrings","sm":["forearms","glutes","lowerback","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Begin standing while holding a bar at arm's length in front of you.","img":"Romanian_Deadlift_from_Deficit"},{"n":"Rope Crunch","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Kneel 1-2 feet in front of a cable system with a rope attached.","img":"Rope_Crunch"},{"n":"Rope Straight-Arm Pulldown","m":"back","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"pullvert","i":"Attach a rope to a high pulley and make your weight selection.","img":"Rope_Straight-Arm_Pulldown"},{"n":"Russian Twist","m":"abs","sm":["lowerback"],"eq":"Bodyweight","lv":"I","mech":"C","a":"ab","i":"Lie down on the floor placing your feet either under something that will not move or by having a partner hold them.","img":"Russian_Twist"},{"n":"Scissors Jump","m":"quads","sm":["glutes","hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"Assume a lunge stance position with one foot forward with the knee bent, and the rear knee nearly touching the ground.","img":"Scissors_Jump"},{"n":"Seated Barbell Military Press","m":"shoulders","sm":["triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"Sit on a Military Press Bench with a bar behind your head and either have a spotter give you the bar (better on the rotator cuff this way) or pick it up yourself…","img":"Seated_Barbell_Military_Press"},{"n":"Seated Barbell Twist","m":"abs","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"ab","i":"Start out by sitting at the end of a flat bench with a barbell placed on top of your thighs.","img":"Seated_Barbell_Twist"},{"n":"Seated Bent-Over One-Arm Dumbbell Triceps Extension","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"Sit down at the end of a flat bench with a dumbbell in one arm using a neutral grip (palms of the hand facing you).","img":"Seated_Bent-Over_One-Arm_Dumbbell_Triceps_Extension"},{"n":"Seated Bent-Over Rear Delt Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"rearfly","i":"Place a couple of dumbbells looking forward in front of a flat bench. Sit on the end of the bench with your legs together and the dumbbells behind your calves.","img":"Seated_Bent-Over_Rear_Delt_Raise"},{"n":"Seated Bent-Over Two-Arm Dumbbell Triceps Extension","m":"triceps","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"extension","i":"Sit down at the end of a flat bench with a dumbbell in both arms using a neutral grip (palms of the hand facing you).","img":"Seated_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension"},{"n":"Seated Cable Rows","m":"back","sm":["biceps","back","shoulders"],"eq":"Cable","lv":"B","mech":"C","a":"pullhoriz","i":"For this exercise you will need access to a low pulley row machine with a V-bar.","img":"Seated_Cable_Rows"},{"n":"Seated Cable Shoulder Press","m":"shoulders","sm":["triceps"],"eq":"Cable","lv":"B","mech":"C","a":"pressvert","i":"Adjust the weight to an appropriate amount and be seated, grasping the handles.","img":"Seated_Cable_Shoulder_Press"},{"n":"Seated Calf Raise","m":"calves","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"calf","i":"Sit on the machine and place your toes on the lower portion of the platform provided with the heels extending off.","img":"Seated_Calf_Raise"},{"n":"Seated Close-Grip Concentration Barbell Curl","m":"biceps","sm":[],"eq":"Barbell","lv":"I","mech":"I","a":"curl","i":"Sit down on a flat bench with a barbell or E-Z Bar in front of you in between your legs.","img":"Seated_Close-Grip_Concentration_Barbell_Curl"},{"n":"Seated Dumbbell Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Sit on a flat bench with a dumbbell on each hand being held at arms length.","img":"Seated_Dumbbell_Curl"},{"n":"Seated Dumbbell Inner Biceps Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Sit on the end of a flat bench with a dumbbell in each hand being held at arms length.","img":"Seated_Dumbbell_Inner_Biceps_Curl"},{"n":"Seated Dumbbell Palms-Down Wrist Curl","m":"forearms","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Start out by placing two dumbbells on the floor in front of a flat bench.","img":"Seated_Dumbbell_Palms-Down_Wrist_Curl"},{"n":"Seated Dumbbell Palms-Up Wrist Curl","m":"forearms","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Start out by placing two dumbbells on the floor in front of a flat bench.","img":"Seated_Dumbbell_Palms-Up_Wrist_Curl"},{"n":"Seated Dumbbell Press","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pressvert","i":"Grab a couple of dumbbells and sit on a military press bench or a utility bench that has a back support on it as you place the dumbbells upright on top of your thighs.","img":"Seated_Dumbbell_Press"},{"n":"Seated Flat Bench Leg Pull-In","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"presshoriz","i":"Sit on a bench with the legs stretched out in front of you slightly below parallel and your arms holding on to the sides of the bench.","img":"Seated_Flat_Bench_Leg_Pull-In"},{"n":"Seated Good Mornings","m":"lowerback","sm":["glutes"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Set up a box in a power rack.","img":"Seated_Good_Mornings"},{"n":"Seated Leg Curl","m":"hamstrings","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"legcurl","i":"Adjust the machine lever to fit your height and sit on the machine with your back against the back support pad.","img":"Seated_Leg_Curl"},{"n":"Seated Leg Tucks","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Sit on a bench with the legs stretched out in front of you slightly below parallel and your arms holding on to the sides of the bench.","img":"Seated_Leg_Tucks"},{"n":"Seated One-Arm Dumbbell Palms-Down Wrist Curl","m":"forearms","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"curl","i":"Sit on a flat bench with a dumbbell in your right hand. Place your feet flat on the floor, at a distance that is slightly wider than shoulder width apart.","img":"Seated_One-Arm_Dumbbell_Palms-Down_Wrist_Curl"},{"n":"Seated One-Arm Dumbbell Palms-Up Wrist Curl","m":"forearms","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Sit on a flat bench with a dumbbell in your right hand. Place your feet flat on the floor, at a distance that is slightly wider than shoulder width apart.","img":"Seated_One-Arm_Dumbbell_Palms-Up_Wrist_Curl"},{"n":"Seated One-arm Cable Pulley Rows","m":"back","sm":["biceps","back","traps"],"eq":"Cable","lv":"I","mech":"C","a":"pullhoriz","i":"To get into the starting position, first sit down on the machine and place your feet on the front platform or crossbar provided making sure that your knees are slightly…","img":"Seated_One-arm_Cable_Pulley_Rows"},{"n":"Seated Palm-Up Barbell Wrist Curl","m":"forearms","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Hold a barbell with both hands and your palms facing up; hands spaced about shoulder width.","img":"Seated_Palm-Up_Barbell_Wrist_Curl"},{"n":"Seated Palms-Down Barbell Wrist Curl","m":"forearms","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Hold a barbell with both hands and your palms facing down; hands spaced about shoulder width.","img":"Seated_Palms-Down_Barbell_Wrist_Curl"},{"n":"Seated Side Lateral Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"lateralraise","i":"Pick a couple of dumbbells and sit at the end of a flat bench with your feet firmly on the floor.","img":"Seated_Side_Lateral_Raise"},{"n":"Seated Triceps Press","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"Sit down on a bench with back support and grasp a dumbbell with both hands and hold it overhead at arm's length.","img":"Seated_Triceps_Press"},{"n":"Seated Two-Arm Palms-Up Low-Pulley Wrist Curl","m":"forearms","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"curl","i":"Put a bench in front of a low pulley machine that has a barbell or EZ Curl attachment on it.","img":"Seated_Two-Arm_Palms-Up_Low-Pulley_Wrist_Curl"},{"n":"See-Saw Press (Alternating Side Press)","m":"shoulders","sm":["abs","triceps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"pressvert","i":"Grab a dumbbell with each hand and stand up erect.","img":"See-Saw_Press_Alternating_Side_Press"},{"n":"Shotgun Row","m":"back","sm":["biceps","back"],"eq":"Cable","lv":"B","mech":"C","a":"pullhoriz","i":"Attach a single handle to a low cable.","img":"Shotgun_Row"},{"n":"Shoulder Press - With Bands","m":"shoulders","sm":["triceps"],"eq":"Band","lv":"B","mech":"C","a":"pressvert","i":"To begin, stand on an exercise band so that tension begins at arm's length.","img":"Shoulder_Press_-_With_Bands"},{"n":"Side Bridge","m":"abs","sm":["shoulders"],"eq":"Bodyweight","lv":"B","mech":"C","a":"hipthrust","i":"","img":"Side_Bridge"},{"n":"Side Jackknife","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"","img":"Side_Jackknife"},{"n":"Side Lateral Raise","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"lateralraise","i":"Pick a couple of dumbbells and stand with a straight torso and the dumbbells by your side at arms length with the palms of the hand facing you.","img":"Side_Lateral_Raise"},{"n":"Side Laterals to Front Raise","m":"shoulders","sm":["traps"],"eq":"Dumbbell","lv":"B","mech":"I","a":"lateralraise","i":"In a standing position, hold a pair of dumbbells at your side.","img":"Side_Laterals_to_Front_Raise"},{"n":"Single-Arm Cable Crossover","m":"chest","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"fly","i":"Begin by moving the pulleys to the high position, select the resistance to be used, and take a handle in each hand.","img":"Single-Arm_Cable_Crossover"},{"n":"Single-Arm Linear Jammer","m":"shoulders","sm":["chest","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"Position a bar into a landmine or securely anchor it in a corner.","img":"Single-Arm_Linear_Jammer"},{"n":"Single-Arm Push-Up","m":"chest","sm":["shoulders","triceps"],"eq":"Bodyweight","lv":"I","mech":"C","a":"presshoriz","i":"Begin laying prone on the ground.","img":"Single-Arm_Push-Up"},{"n":"Single-Leg Leg Extension","m":"quads","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"legext","i":"Seat yourself in the machine and adjust it so that you are positioned properly.","img":"Single-Leg_Leg_Extension"},{"n":"Single Dumbbell Raise","m":"shoulders","sm":["forearms","traps"],"eq":"Dumbbell","lv":"B","mech":"I","a":"pressvert","i":"With a wide stance, hold a dumbell with both hands, grasping the head of the dumbbell instead of the handle.","img":"Single_Dumbbell_Raise"},{"n":"Single Leg Butt Kick","m":"quads","sm":["calves","hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"Begin by standing on one leg, with the bent knee raised.","img":"Single_Leg_Butt_Kick"},{"n":"Single Leg Glute Bridge","m":"glutes","sm":["hamstrings"],"eq":"Bodyweight","lv":"B","mech":"I","a":"hipthrust","i":"Lay on the floor with your feet flat and knees bent. Raise one leg off of the ground, pulling the knee to your chest. This will be your starting position.","img":"Single_Leg_Glute_Bridge"},{"n":"Sit-Up","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"Lie down on the floor placing your feet either under something that will not move or by having a partner hold them.","img":"Sit-Up"},{"n":"Smith Incline Shoulder Raise","m":"shoulders","sm":["chest"],"eq":"Barbell","lv":"B","mech":"I","a":"pressvert","i":"Place an incline bench underneath the smith machine.","img":"Smith_Incline_Shoulder_Raise"},{"n":"Smith Machine Behind the Back Shrug","m":"traps","sm":["shoulders"],"eq":"Machine","lv":"B","mech":"I","a":"shrug","i":"With the bar at thigh level, load an appropriate weight.","img":"Smith_Machine_Behind_the_Back_Shrug"},{"n":"Smith Machine Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Machine","lv":"B","mech":"C","a":"presshoriz","i":"Place a flat bench underneath the smith machine.","img":"Smith_Machine_Bench_Press"},{"n":"Smith Machine Bent Over Row","m":"back","sm":["biceps","back","shoulders"],"eq":"Machine","lv":"B","mech":"C","a":"pullhoriz","i":"Set the barbell attached to the smith machine to a height that is about 2 inches below your knees.","img":"Smith_Machine_Bent_Over_Row"},{"n":"Smith Machine Calf Raise","m":"calves","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"calf","i":"Place a block or weight plate below the bar on the Smith machine.","img":"Smith_Machine_Calf_Raise"},{"n":"Smith Machine Close-Grip Bench Press","m":"triceps","sm":["chest","shoulders"],"eq":"Machine","lv":"B","mech":"C","a":"extension","i":"Place a flat bench underneath the smith machine.","img":"Smith_Machine_Close-Grip_Bench_Press"},{"n":"Smith Machine Decline Press","m":"chest","sm":["shoulders","triceps"],"eq":"Machine","lv":"B","mech":"C","a":"presshoriz","i":"Position a decline bench in the rack so that the bar will be above your chest.","img":"Smith_Machine_Decline_Press"},{"n":"Smith Machine Hang Power Clean","m":"hamstrings","sm":["glutes","lowerback","quads","shoulders","traps"],"eq":"Machine","lv":"I","mech":"C","a":"hinge","i":"Position the bar at knee height and load it to an appropriate weight.","img":"Smith_Machine_Hang_Power_Clean"},{"n":"Smith Machine Hip Raise","m":"abs","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"ab","i":"Position a bench in the rack and load the bar to an appropriate weight.","img":"Smith_Machine_Hip_Raise"},{"n":"Smith Machine Incline Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Machine","lv":"B","mech":"C","a":"presshoriz","i":"Place an incline bench underneath the smith machine.","img":"Smith_Machine_Incline_Bench_Press"},{"n":"Smith Machine Leg Press","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"I","mech":"C","a":"squat","i":"Position a Smith machine bar a couple feet off of the ground.","img":"Smith_Machine_Leg_Press"},{"n":"Smith Machine One-Arm Upright Row","m":"shoulders","sm":["biceps","traps"],"eq":"Machine","lv":"B","mech":"C","a":"pullhoriz","i":"With the bar at thigh level, load an appropriate weight.","img":"Smith_Machine_One-Arm_Upright_Row"},{"n":"Smith Machine Overhead Shoulder Press","m":"shoulders","sm":["triceps"],"eq":"Machine","lv":"B","mech":"C","a":"pressvert","i":"To begin, place a flat bench (or preferably one with back support) underneath a smith machine.","img":"Smith_Machine_Overhead_Shoulder_Press"},{"n":"Smith Machine Pistol Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"I","mech":"C","a":"squat","i":"To begin, first set the bar to a position that best matches your height.","img":"Smith_Machine_Pistol_Squat"},{"n":"Smith Machine Reverse Calf Raises","m":"calves","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"calf","i":"Adjust the barbell on the smith machine to fit your height and align a raised platform right under the bar.","img":"Smith_Machine_Reverse_Calf_Raises"},{"n":"Smith Machine Squat","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Machine","lv":"B","mech":"C","a":"squat","i":"To begin, first set the bar on the height that best matches your height.","img":"Smith_Machine_Squat"},{"n":"Smith Machine Stiff-Legged Deadlift","m":"hamstrings","sm":["glutes","lowerback"],"eq":"Machine","lv":"B","mech":"C","a":"hinge","i":"To begin, set the bar on the smith machine to a height that is around the middle of your thighs.","img":"Smith_Machine_Stiff-Legged_Deadlift"},{"n":"Smith Machine Upright Row","m":"traps","sm":["biceps","back","shoulders"],"eq":"Machine","lv":"B","mech":"C","a":"pullhoriz","i":"To begin, set the bar on the smith machine to a height that is around the middle of your thighs.","img":"Smith_Machine_Upright_Row"},{"n":"Smith Single-Leg Split Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Machine","lv":"B","mech":"C","a":"squat","i":"To begin, place a flat bench 2-3 feet behind the smith machine.","img":"Smith_Single-Leg_Split_Squat"},{"n":"Snatch","m":"quads","sm":["biceps","glutes","hamstrings","lowerback","shoulders","traps","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Place your feet at a shoulder width stance with the barbell resting right above the connection between the toes and the rest of the foot.","img":"Snatch"},{"n":"Snatch Balance","m":"quads","sm":["calves","glutes","hamstrings","shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Begin with the feet in the pulling position, the bar racked across the back of the shoulders, and the hands placed in a wide snatch grip.","img":"Snatch_Balance"},{"n":"Snatch Deadlift","m":"hamstrings","sm":["forearms","glutes","hamstrings","lowerback","quads","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"The snatch deadlift strengthens the first pull of the snatch.","img":"Snatch_Deadlift"},{"n":"Snatch Pull","m":"hamstrings","sm":["calves","glutes","lowerback","quads","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"With a barbell on the floor close to the shins, take a wide snatch grip.","img":"Snatch_Pull"},{"n":"Snatch Shrug","m":"traps","sm":["forearms","shoulders"],"eq":"Barbell","lv":"I","mech":"C","a":"shrug","i":"Begin with a wide grip, with the bar hanging at the mid thigh position.","img":"Snatch_Shrug"},{"n":"Snatch from Blocks","m":"quads","sm":["calves","forearms","glutes","hamstrings","lowerback","shoulders","traps","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Begin with a loaded barbell on boxes or stands of the desired height.","img":"Snatch_from_Blocks"},{"n":"Speed Band Overhead Triceps","m":"triceps","sm":[],"eq":"Band","lv":"B","mech":"I","a":"extension","i":"For this exercise anchor a band to the ground.","img":"Speed_Band_Overhead_Triceps"},{"n":"Speed Box Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Attach bands to the bar that are securely anchored near the ground.","img":"Speed_Box_Squat"},{"n":"Speed Squats","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Speed_Squats"},{"n":"Spell Caster","m":"abs","sm":["glutes","shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"ab","i":"Hold a dumbbell in each hand with a pronated grip.","img":"Spell_Caster"},{"n":"Spider Crawl","m":"abs","sm":["chest","shoulders","triceps"],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Begin in a prone position on the floor.","img":"Spider_Crawl"},{"n":"Spider Curl","m":"biceps","sm":[],"eq":"EZ Bar","lv":"B","mech":"I","a":"curl","i":"Start out by setting the bar on the part of the preacher bench that you would normally sit on.","img":"Spider_Curl"},{"n":"Split Clean","m":"quads","sm":["calves","forearms","glutes","hamstrings","lowerback","shoulders","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"With a barbell on the floor close to the shins, take an overhand grip just outside the legs.","img":"Split_Clean"},{"n":"Split Jerk","m":"quads","sm":["glutes","hamstrings","shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Standing with the weight racked on the front of the shoulders, begin with the dip.","img":"Split_Jerk"},{"n":"Split Jump","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"Assume a lunge stance position with one foot forward with the knee bent, and the rear knee nearly touching the ground.","img":"Split_Jump"},{"n":"Split Snatch","m":"hamstrings","sm":["calves","forearms","glutes","hamstrings","lowerback","quads","shoulders","traps","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"hinge","i":"Begin with a loaded barbell on the floor.","img":"Split_Snatch"},{"n":"Split Squat with Dumbbells","m":"quads","sm":["glutes","hamstrings"],"eq":"Dumbbell","lv":"B","mech":"C","a":"squat","i":"Position yourself into a staggered stance with the rear foot elevated and front foot forward.","img":"Split_Squat_with_Dumbbells"},{"n":"Squat Jerk","m":"quads","sm":["calves","glutes","hamstrings","shoulders","triceps"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Standing with the weight racked on the front of the shoulders, begin with the dip.","img":"Squat_Jerk"},{"n":"Squat with Bands","m":"quads","sm":["quads","calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Set up the bands on the sleeves, secured to either band pegs, the rack, or dumbbells so that there is appropriate tension.","img":"Squat_with_Bands"},{"n":"Squat with Chains","m":"quads","sm":["quads","calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"To set up the chains, begin by looping the leader chain over the sleeves of the bar.","img":"Squat_with_Chains"},{"n":"Squat with Plate Movers","m":"quads","sm":["glutes","quads","calves","glutes","hamstrings"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"To begin, first set the bar on a rack to just below shoulder level.","img":"Squat_with_Plate_Movers"},{"n":"Squats - With Bands","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Band","lv":"B","mech":"C","a":"squat","i":"To start out, make sure that the exercise band is at an even split between both the left and right side of the body.","img":"Squats_-_With_Bands"},{"n":"Standing Alternating Dumbbell Press","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pressvert","i":"Stand with a dumbbell in each hand.","img":"Standing_Alternating_Dumbbell_Press"},{"n":"Standing Barbell Calf Raise","m":"calves","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"calf","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Standing_Barbell_Calf_Raise"},{"n":"Standing Barbell Press Behind Neck","m":"shoulders","sm":["triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"pressvert","i":"This exercise is best performed inside a squat rack for easier pick up of the bar.","img":"Standing_Barbell_Press_Behind_Neck"},{"n":"Standing Bent-Over One-Arm Dumbbell Triceps Extension","m":"triceps","sm":["shoulders"],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"With a dumbbell in one hand and the palm facing your torso, bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back…","img":"Standing_Bent-Over_One-Arm_Dumbbell_Triceps_Extension"},{"n":"Standing Bent-Over Two-Arm Dumbbell Triceps Extension","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"With a dumbbell in each hand and the palms facing your torso, bend your knees slightly and bring your torso forward, by bending at the waist, while keeping the back…","img":"Standing_Bent-Over_Two-Arm_Dumbbell_Triceps_Extension"},{"n":"Standing Biceps Cable Curl","m":"biceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"curl","i":"Stand up with your torso upright while holding a cable curl bar that is attached to a low pulley.","img":"Standing_Biceps_Cable_Curl"},{"n":"Standing Bradford Press","m":"shoulders","sm":["triceps"],"eq":"Barbell","lv":"B","mech":"C","a":"pressvert","i":"Place a loaded bar at shoulder level in a rack.","img":"Standing_Bradford_Press"},{"n":"Standing Cable Chest Press","m":"chest","sm":["shoulders","triceps"],"eq":"Cable","lv":"B","mech":"C","a":"presshoriz","i":"Position dual pulleys to chest height and select an appropriate weight.","img":"Standing_Cable_Chest_Press"},{"n":"Standing Cable Lift","m":"abs","sm":["shoulders"],"eq":"Cable","lv":"B","mech":"C","a":"ab","i":"Connect a standard handle on a tower, and move the cable to the lowest pulley position.","img":"Standing_Cable_Lift"},{"n":"Standing Cable Wood Chop","m":"abs","sm":["shoulders"],"eq":"Cable","lv":"B","mech":"C","a":"ab","i":"Connect a standard handle to a tower, and move the cable to the highest pulley position.","img":"Standing_Cable_Wood_Chop"},{"n":"Standing Calf Raises","m":"calves","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"calf","i":"Adjust the padded lever of the calf raise machine to fit your height.","img":"Standing_Calf_Raises"},{"n":"Standing Concentration Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Taking a dumbbell in your working hand, lean forward.","img":"Standing_Concentration_Curl"},{"n":"Standing Dumbbell Calf Raise","m":"calves","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"calf","i":"Stand with your torso upright holding two dumbbells in your hands by your sides.","img":"Standing_Dumbbell_Calf_Raise"},{"n":"Standing Dumbbell Press","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pressvert","i":"Standing with your feet shoulder width apart, take a dumbbell in each hand.","img":"Standing_Dumbbell_Press"},{"n":"Standing Dumbbell Reverse Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"I","mech":"I","a":"curl","i":"To begin, stand straight with a dumbbell in each hand using a pronated grip (palms facing down).","img":"Standing_Dumbbell_Reverse_Curl"},{"n":"Standing Dumbbell Straight-Arm Front Delt Raise Above Head","m":"shoulders","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"pressvert","i":"Hold the dumbbells in front of your thighs, palms facing your thighs.","img":"Standing_Dumbbell_Straight-Arm_Front_Delt_Raise_Above_Head"},{"n":"Standing Dumbbell Triceps Extension","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"To begin, stand up with a dumbbell held by both hands.","img":"Standing_Dumbbell_Triceps_Extension"},{"n":"Standing Dumbbell Upright Row","m":"traps","sm":["biceps","shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pullhoriz","i":"Grasp a dumbbell in each hand with a pronated (palms forward) grip that is slightly less than shoulder width.","img":"Standing_Dumbbell_Upright_Row"},{"n":"Standing Front Barbell Raise Over Head","m":"shoulders","sm":[],"eq":"Barbell","lv":"I","mech":"I","a":"pressvert","i":"To begin, stand straight with a barbell in your hands.","img":"Standing_Front_Barbell_Raise_Over_Head"},{"n":"Standing Inner-Biceps Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"I","mech":"I","a":"curl","i":"Stand up with a dumbbell in each hand being held at arms length.","img":"Standing_Inner-Biceps_Curl"},{"n":"Standing Leg Curl","m":"hamstrings","sm":[],"eq":"Machine","lv":"B","mech":"I","a":"legcurl","i":"Adjust the machine lever to fit your height and lie with your torso bent at the waist facing forward around 30-45 degrees (since an angled position is more favorable for…","img":"Standing_Leg_Curl"},{"n":"Standing Long Jump","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"This drill is best done in sand or other soft landing surface.","img":"Standing_Long_Jump"},{"n":"Standing Low-Pulley Deltoid Raise","m":"shoulders","sm":["forearms"],"eq":"Cable","lv":"B","mech":"I","a":"pressvert","i":"Start by standing to the right side of a low pulley row.","img":"Standing_Low-Pulley_Deltoid_Raise"},{"n":"Standing Low-Pulley One-Arm Triceps Extension","m":"triceps","sm":["chest","shoulders"],"eq":"Cable","lv":"I","mech":"I","a":"extension","i":"Grab a single handle with your left arm next to the low pulley machine.","img":"Standing_Low-Pulley_One-Arm_Triceps_Extension"},{"n":"Standing Military Press","m":"shoulders","sm":["triceps"],"eq":"Barbell","lv":"B","mech":"C","a":"pressvert","i":"Start by placing a barbell that is about chest high on a squat rack.","img":"Standing_Military_Press"},{"n":"Standing One-Arm Cable Curl","m":"biceps","sm":[],"eq":"Cable","lv":"I","mech":"I","a":"curl","i":"Start out by grabbing single handle next to the low pulley machine.","img":"Standing_One-Arm_Cable_Curl"},{"n":"Standing One-Arm Dumbbell Curl Over Incline Bench","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Stand on the back side of an incline bench as if you were going to be a spotter for someone.","img":"Standing_One-Arm_Dumbbell_Curl_Over_Incline_Bench"},{"n":"Standing One-Arm Dumbbell Triceps Extension","m":"triceps","sm":["chest","shoulders"],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"To begin, stand up with a dumbbell held in one hand.","img":"Standing_One-Arm_Dumbbell_Triceps_Extension"},{"n":"Standing Overhead Barbell Triceps Extension","m":"triceps","sm":["shoulders"],"eq":"Barbell","lv":"B","mech":"I","a":"extension","i":"To begin, stand up holding a barbell or e-z bar using a pronated grip (palms facing forward) with your hands closer than shoulder width apart from each other.","img":"Standing_Overhead_Barbell_Triceps_Extension"},{"n":"Standing Palm-In One-Arm Dumbbell Press","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"B","mech":"C","a":"pressvert","i":"Start by having a dumbbell in one hand with your arm fully extended to the side using a neutral grip.","img":"Standing_Palm-In_One-Arm_Dumbbell_Press"},{"n":"Standing Palms-In Dumbbell Press","m":"shoulders","sm":["triceps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"pressvert","i":"Start by having a dumbbell in each hand with your arm fully extended to the side using a neutral grip.","img":"Standing_Palms-In_Dumbbell_Press"},{"n":"Standing Palms-Up Barbell Behind The Back Wrist Curl","m":"forearms","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Start by standing straight and holding a barbell behind your glutes at arm's length while using a pronated grip (palms will be facing back away from the glutes) and…","img":"Standing_Palms-Up_Barbell_Behind_The_Back_Wrist_Curl"},{"n":"Standing Rope Crunch","m":"abs","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"ab","i":"Attach a rope to a high pulley and select an appropriate weight.","img":"Standing_Rope_Crunch"},{"n":"Standing Towel Triceps Extension","m":"triceps","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"extension","i":"To begin, stand up with both arms fully extended above the head holding one end of a towel with both hands.","img":"Standing_Towel_Triceps_Extension"},{"n":"Standing Two-Arm Overhead Throw","m":"shoulders","sm":["chest","back"],"eq":"Med Ball","lv":"B","mech":"C","a":"pullhoriz","i":"Stand with your feet shoulder width apart holding a medicine ball in both hands.","img":"Standing_Two-Arm_Overhead_Throw"},{"n":"Star Jump","m":"quads","sm":["calves","glutes","hamstrings","shoulders"],"eq":"Bodyweight","lv":"B","mech":"C","a":"squat","i":"Begin in a relaxed stance with your feet shoulder width apart and hold your arms close to the body.","img":"Star_Jump"},{"n":"Step-up with Knee Raise","m":"glutes","sm":["hamstrings","quads"],"eq":"Bodyweight","lv":"B","mech":"C","a":"lunge","i":"Stand facing a box or bench of an appropriate height with your feet together.","img":"Step-up_with_Knee_Raise"},{"n":"Stiff-Legged Barbell Deadlift","m":"hamstrings","sm":["glutes","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Grasp a bar using an overhand grip (palms facing down).","img":"Stiff-Legged_Barbell_Deadlift"},{"n":"Stiff-Legged Dumbbell Deadlift","m":"hamstrings","sm":["glutes","lowerback"],"eq":"Dumbbell","lv":"B","mech":"C","a":"hinge","i":"Grasp a couple of dumbbells holding them by your side at arm's length.","img":"Stiff-Legged_Dumbbell_Deadlift"},{"n":"Stiff Leg Barbell Good Morning","m":"lowerback","sm":["glutes","hamstrings"],"eq":"Barbell","lv":"B","mech":"C","a":"hinge","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Stiff_Leg_Barbell_Good_Morning"},{"n":"Straight-Arm Dumbbell Pullover","m":"chest","sm":["back","shoulders","triceps"],"eq":"Dumbbell","lv":"I","mech":"C","a":"presshoriz","i":"Place a dumbbell standing up on a flat bench.","img":"Straight-Arm_Dumbbell_Pullover"},{"n":"Straight-Arm Pulldown","m":"back","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"pullvert","i":"You will start by grabbing the wide bar from the top pulley of a pulldown machine and using a wider than shoulder-width pronated (palms down) grip.","img":"Straight-Arm_Pulldown"},{"n":"Straight Bar Bench Mid Rows","m":"back","sm":["biceps","back"],"eq":"Barbell","lv":"B","mech":"C","a":"pullhoriz","i":"Place a loaded barbell on the end of a bench.","img":"Straight_Bar_Bench_Mid_Rows"},{"n":"Straight Raises on Incline Bench","m":"shoulders","sm":["traps"],"eq":"Barbell","lv":"B","mech":"I","a":"presshoriz","i":"Place a bar on the ground behind the head of an incline bench.","img":"Straight_Raises_on_Incline_Bench"},{"n":"Sumo Deadlift","m":"hamstrings","sm":["quads","forearms","glutes","lowerback","back","quads","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Begin with a bar loaded on the ground.","img":"Sumo_Deadlift"},{"n":"Sumo Deadlift with Bands","m":"hamstrings","sm":["quads","forearms","glutes","lowerback","back","quads","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"To deadlift with short bands, simply loop them over the bar before you start, and step into them to set up.","img":"Sumo_Deadlift_with_Bands"},{"n":"Sumo Deadlift with Chains","m":"hamstrings","sm":["glutes","quads","forearms","glutes","lowerback","back","quads","traps"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"You can attach the chains to the sleeves of the bar, or just drape the middle over the bar so there is a greater weight increase as you lift.","img":"Sumo_Deadlift_with_Chains"},{"n":"Supine Chest Throw","m":"triceps","sm":["chest","shoulders"],"eq":"Med Ball","lv":"B","mech":"C","a":"pullhoriz","i":"This drill is great for chest passes when you lack a partner or a wall of sufficient strength.","img":"Supine_Chest_Throw"},{"n":"Supine One-Arm Overhead Throw","m":"abs","sm":["chest","back","shoulders"],"eq":"Med Ball","lv":"B","mech":"C","a":"pullhoriz","i":"Lay on the ground on your back with your knees bent.","img":"Supine_One-Arm_Overhead_Throw"},{"n":"Supine Two-Arm Overhead Throw","m":"abs","sm":["chest","back","shoulders"],"eq":"Med Ball","lv":"B","mech":"C","a":"pullhoriz","i":"Lay on the ground on your back with your knees bent. Hold the ball with both hands, extending the arms fully behind your head. This will be your starting position.","img":"Supine_Two-Arm_Overhead_Throw"},{"n":"T-Bar Row with Handle","m":"back","sm":["biceps","back"],"eq":"Barbell","lv":"B","mech":"C","a":"pullhoriz","i":"Position a bar into a landmine or in a corner to keep it from moving.","img":"T-Bar_Row_with_Handle"},{"n":"Tate Press","m":"triceps","sm":["chest","shoulders"],"eq":"Dumbbell","lv":"I","mech":"I","a":"extension","i":"Lie down on a flat bench with a dumbbell in each hand on top of your thighs.","img":"Tate_Press"},{"n":"Thigh Abductor","m":"glutes","sm":["glutes"],"eq":"Machine","lv":"B","mech":"I","a":"generic","i":"To begin, sit down on the abductor machine and select a weight you are comfortable with.","img":"Thigh_Abductor"},{"n":"Thigh Adductor","m":"quads","sm":["glutes","hamstrings"],"eq":"Machine","lv":"B","mech":"I","a":"generic","i":"To begin, sit down on the adductor machine and select a weight you are comfortable with.","img":"Thigh_Adductor"},{"n":"Tricep Dumbbell Kickback","m":"triceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"extension","i":"Start with a dumbbell in each hand and your palms facing your torso.","img":"Tricep_Dumbbell_Kickback"},{"n":"Triceps Overhead Extension with Rope","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Attach a rope to a low pulley.","img":"Triceps_Overhead_Extension_with_Rope"},{"n":"Triceps Pushdown","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Attach a straight or angled bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width.","img":"Triceps_Pushdown"},{"n":"Triceps Pushdown - Rope Attachment","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Attach a rope attachment to a high pulley and grab with a neutral grip (palms facing each other).","img":"Triceps_Pushdown_-_Rope_Attachment"},{"n":"Triceps Pushdown - V-Bar Attachment","m":"triceps","sm":[],"eq":"Cable","lv":"B","mech":"I","a":"extension","i":"Attach a V-Bar to a high pulley and grab with an overhand grip (palms facing down) at shoulder width.","img":"Triceps_Pushdown_-_V-Bar_Attachment"},{"n":"Tuck Crunch","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"I","a":"ab","i":"To begin, lie down on the floor or an exercise mat with your back pressed against the floor.","img":"Tuck_Crunch"},{"n":"Two-Arm Dumbbell Preacher Curl","m":"biceps","sm":[],"eq":"Dumbbell","lv":"B","mech":"I","a":"curl","i":"Grab a dumbbell with each arm and place the upper arms on top of the preacher bench or the incline bench.","img":"Two-Arm_Dumbbell_Preacher_Curl"},{"n":"Two-Arm Kettlebell Clean","m":"shoulders","sm":["calves","glutes","hamstrings","lowerback","traps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Place two kettlebells between your feet.","img":"Two-Arm_Kettlebell_Clean"},{"n":"Two-Arm Kettlebell Jerk","m":"shoulders","sm":["calves","quads","triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean two kettlebells to your shoulders.","img":"Two-Arm_Kettlebell_Jerk"},{"n":"Two-Arm Kettlebell Military Press","m":"shoulders","sm":["triceps"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pressvert","i":"Clean two kettlebells to your shoulders.","img":"Two-Arm_Kettlebell_Military_Press"},{"n":"Two-Arm Kettlebell Row","m":"back","sm":["biceps","back"],"eq":"Kettlebell","lv":"I","mech":"C","a":"pullhoriz","i":"Place two kettlebells in front of your feet.","img":"Two-Arm_Kettlebell_Row"},{"n":"Underhand Cable Pulldowns","m":"back","sm":["biceps","back","shoulders"],"eq":"Cable","lv":"B","mech":"C","a":"pullvert","i":"Sit down on a pull-down machine with a wide bar attached to the top pulley.","img":"Underhand_Cable_Pulldowns"},{"n":"Upright Barbell Row","m":"shoulders","sm":["traps"],"eq":"Barbell","lv":"B","mech":"C","a":"pullhoriz","i":"Grasp a barbell with an overhand grip that is slightly less than shoulder width.","img":"Upright_Barbell_Row"},{"n":"Upright Cable Row","m":"traps","sm":["shoulders"],"eq":"Cable","lv":"I","mech":"C","a":"pullhoriz","i":"Grasp a straight bar cable attachment that is attached to a low pulley with a pronated (palms facing your thighs) grip that is slightly less than shoulder width.","img":"Upright_Cable_Row"},{"n":"Upright Row - With Bands","m":"traps","sm":["shoulders"],"eq":"Band","lv":"B","mech":"C","a":"pullhoriz","i":"To begin, stand on an exercise band so that tension begins at arm's length.","img":"Upright_Row_-_With_Bands"},{"n":"V-Bar Pulldown","m":"back","sm":["biceps","back","shoulders"],"eq":"Cable","lv":"I","mech":"C","a":"pullvert","i":"Sit down on a pull-down machine with a V-Bar attached to the top pulley.","img":"V-Bar_Pulldown"},{"n":"V-Bar Pullup","m":"back","sm":["biceps","back","shoulders"],"eq":"Bodyweight","lv":"B","mech":"C","a":"pullvert","i":"Start by placing the middle of the V-bar in the middle of the pull-up bar (assuming that the pull-up station you are using does not have neutral grip handles).","img":"V-Bar_Pullup"},{"n":"Vertical Swing","m":"hamstrings","sm":["glutes","quads","shoulders"],"eq":"Dumbbell","lv":"B","mech":"C","a":"hinge","i":"Allow the dumbbell to hang at arms length between your legs, holding it with both hands.","img":"Vertical_Swing"},{"n":"Weighted Crunches","m":"abs","sm":[],"eq":"Med Ball","lv":"B","mech":"I","a":"ab","i":"Lie flat on your back with your feet flat on the ground or resting on a bench with your knees bent at a 90 degree angle.","img":"Weighted_Crunches"},{"n":"Weighted Jump Squat","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"Position a lightly loaded barbell across the back of your shoulders.","img":"Weighted_Jump_Squat"},{"n":"Weighted Sissy Squat","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"Standing upright, with feet at shoulder width and toes raised, use one hand to hold onto the beams of a squat rack and the opposite arm to hold a plate on top of your chest.","img":"Weighted_Sissy_Squat"},{"n":"Wide-Grip Barbell Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Lie back on a flat bench with feet firm on the floor.","img":"Wide-Grip_Barbell_Bench_Press"},{"n":"Wide-Grip Decline Barbell Bench Press","m":"chest","sm":["shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Lie back on a decline bench with the feet securely locked at the front of the bench.","img":"Wide-Grip_Decline_Barbell_Bench_Press"},{"n":"Wide-Grip Decline Barbell Pullover","m":"chest","sm":["shoulders","triceps"],"eq":"Barbell","lv":"I","mech":"C","a":"presshoriz","i":"Lie down on a decline bench with both legs securely locked in position.","img":"Wide-Grip_Decline_Barbell_Pullover"},{"n":"Wide-Grip Lat Pulldown","m":"back","sm":["biceps","back","shoulders"],"eq":"Cable","lv":"B","mech":"C","a":"pullvert","i":"Sit down on a pull-down machine with a wide bar attached to the top pulley.","img":"Wide-Grip_Lat_Pulldown"},{"n":"Wide-Grip Pulldown Behind The Neck","m":"back","sm":["biceps","back","shoulders"],"eq":"Cable","lv":"I","mech":"C","a":"pullvert","i":"Sit down on a pull-down machine with a wide bar attached to the top pulley.","img":"Wide-Grip_Pulldown_Behind_The_Neck"},{"n":"Wide-Grip Rear Pull-Up","m":"back","sm":["biceps","back","shoulders"],"eq":"Bodyweight","lv":"I","mech":"C","a":"pullvert","i":"Grab the pull-up bar with the palms facing forward using a wide grip.","img":"Wide-Grip_Rear_Pull-Up"},{"n":"Wide-Grip Standing Barbell Curl","m":"biceps","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Stand up with your torso upright while holding a barbell at the wide outer handle.","img":"Wide-Grip_Standing_Barbell_Curl"},{"n":"Wide Stance Barbell Squat","m":"quads","sm":["calves","glutes","hamstrings","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Wide_Stance_Barbell_Squat"},{"n":"Wide Stance Stiff Legs","m":"hamstrings","sm":["quads","glutes","lowerback"],"eq":"Barbell","lv":"I","mech":"C","a":"hinge","i":"Begin with a barbell loaded on the floor.","img":"Wide_Stance_Stiff_Legs"},{"n":"Wind Sprints","m":"abs","sm":[],"eq":"Bodyweight","lv":"B","mech":"C","a":"ab","i":"Hang from a pull-up bar using a pronated grip.","img":"Wind_Sprints"},{"n":"Wrist Rotations with Straight Bar","m":"forearms","sm":[],"eq":"Barbell","lv":"B","mech":"I","a":"curl","i":"Hold a barbell with both hands and your palms facing down; hands spaced about shoulder width.","img":"Wrist_Rotations_with_Straight_Bar"},{"n":"Zercher Squats","m":"quads","sm":["calves","glutes","hamstrings"],"eq":"Barbell","lv":"E","mech":"C","a":"squat","i":"This exercise is best performed inside a squat rack for safety purposes.","img":"Zercher_Squats"},{"n":"Zottman Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"I","mech":"I","a":"curl","i":"Stand up with your torso upright and a dumbbell in each hand being held at arms length.","img":"Zottman_Curl"},{"n":"Zottman Preacher Curl","m":"biceps","sm":["forearms"],"eq":"Dumbbell","lv":"I","mech":"I","a":"curl","i":"Grab a dumbbell in each hand and place your upper arms on top of the preacher bench or the incline bench.","img":"Zottman_Preacher_Curl"}];

/* ════════════════════════════════════════════════════════════════
   THEME — black, minimal, monochrome. White is the only accent.
═══════════════════════════════════════════════════════════════════ */
const T = {
  bg:        '#000000',
  bgEl:      '#08080a',
  surface:   '#0e0e11',
  surfaceHi: '#16161b',
  surfaceMax:'#1f1f25',
  border:    '#1d1d22',
  borderHi:  '#2c2c34',
  text:      '#f4f4f6',
  textDim:   '#9aa0ab',
  textMute:  '#4c4c55',
  white:     '#ffffff',
  gold:      '#d4af37',
  goldHi:    '#e9d27c',
  goldDeep:  '#a8861f',
  silver:    '#c0c4cc',
  good:      '#e8e8ec',     // "done" highlight — bright off-white
  warn:      '#d9a441',
  danger:    '#c75450',
  heat0:     '#16161b',
  heat1:     '#44464f',
  heat2:     '#8a8f99',
  heat3:     '#d4af37',
};
const FB = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const FM = 'ui-monospace, "SF Mono", "Roboto Mono", Menlo, Consolas, monospace';

const REGIONS = [
  { id: 'chest', label: 'Chest' },
  { id: 'back', label: 'Back' },
  { id: 'shoulders', label: 'Shoulders' },
  { id: 'traps', label: 'Traps' },
  { id: 'biceps', label: 'Biceps' },
  { id: 'triceps', label: 'Triceps' },
  { id: 'forearms', label: 'Forearms' },
  { id: 'abs', label: 'Abs' },
  { id: 'lowerback', label: 'Lower Back' },
  { id: 'glutes', label: 'Glutes' },
  { id: 'quads', label: 'Quads' },
  { id: 'hamstrings', label: 'Hamstrings' },
  { id: 'calves', label: 'Calves' },
];
const REGION_LABEL = Object.fromEntries(REGIONS.map(r => [r.id, r.label]));

/* ════════════════════════════════════════════════════════════════
   STORAGE
═══════════════════════════════════════════════════════════════════ */
const K = { history: 'gymx:history', active: 'gymx:active', settings: 'gymx:settings', rest: 'gymx:rest', custom: 'gymx:custom', templates: 'gymx:templates', weights: 'gymx:weights', garmin: 'gymx:garmin' };
/* ────────────────────────────────────────────────────────────────
   STORAGE BACKEND
   Three modes, auto-selected:
   • Firebase Realtime DB  — when firebase.js holds a real config (deployed).
     Live cross-device sync: phone, laptop, or a shared device all see the
     same data through the same Vercel URL.
   • Claude artifact storage — inside this chat preview.
   • localStorage          — deployed without a Firebase config (single device).
   The app talks only to `store`; the backend underneath is swappable.
──────────────────────────────────────────────────────────────── */
const FB_READY = typeof firebaseConfig === 'object' && firebaseConfig && !/PASTE_YOUR/.test(firebaseConfig.databaseURL || '') && !!firebaseConfig.databaseURL;

// connection/sync status broadcast to the UI
const SyncBus = {
  state: FB_READY ? 'connecting' : (typeof window !== 'undefined' && window.storage ? 'local' : 'local'),
  error: null,
  subs: new Set(),
  set(s, err) { this.state = s; this.error = err || null; this.subs.forEach(fn => fn(s, err || null)); },
  on(fn) { this.subs.add(fn); fn(this.state, this.error); return () => this.subs.delete(fn); },
};

let _fbDb = null;
if (FB_READY) {
  try {
    const app = initializeApp(firebaseConfig);
    _fbDb = getDatabase(app);
    goOnline(_fbDb);
    // connection heartbeat
    onValue(dbRef(_fbDb, '.info/connected'), (snap) => {
      SyncBus.set(snap.val() ? 'synced' : 'offline');
    }, (err) => SyncBus.set('error', err.message));
  } catch (e) {
    SyncBus.set('error', e.message);
  }
}

// localStorage shim (matches window.storage shape)
const _localShim = {
  async get(key) { const v = localStorage.getItem(key); return v == null ? null : { key, value: v }; },
  async set(key, value) { localStorage.setItem(key, value); return { key, value }; },
  async delete(key) { localStorage.removeItem(key); return { key, deleted: true }; },
};
const _legacy = (typeof window !== 'undefined' && window.storage) ? window.storage : _localShim;

const _fbKey = (k) => 'gymx/' + k.replace(/[:.#$\[\]/]/g, '_');

const store = {
  async get(k, fb = null) {
    if (_fbDb) {
      return new Promise((resolve) => {
        onValue(dbRef(_fbDb, _fbKey(k)), (snap) => {
          const v = snap.val();
          resolve(v === null || v === undefined ? fb : v);
        }, () => resolve(fb), { onlyOnce: true });
      });
    }
    try { const r = await _legacy.get(k); return r ? JSON.parse(r.value) : fb; } catch { return fb; }
  },
  async set(k, v) {
    if (_fbDb) {
      try { await dbSet(dbRef(_fbDb, _fbKey(k)), v === undefined ? null : v); }
      catch (e) { SyncBus.set('error', e.message); }
      return;
    }
    try { await _legacy.set(k, JSON.stringify(v)); } catch (e) { console.error(e); }
  },
  async del(k) {
    if (_fbDb) { try { await dbSet(dbRef(_fbDb, _fbKey(k)), null); } catch {} return; }
    try { await _legacy.delete(k); } catch {}
  },
  // live subscription — fires on every remote change (cross-device sync)
  subscribe(k, cb, fb = null) {
    if (_fbDb) {
      return onValue(dbRef(_fbDb, _fbKey(k)), (snap) => {
        const v = snap.val();
        cb(v === null || v === undefined ? fb : v);
      }, () => {});
    }
    return null; // non-firebase backends don't push
  },
};

/* ════════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════════ */
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const lerp = (a, b, t) => a + (b - a) * t;
const lerpPt = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
const easeInOut = (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;

const fmtClock = (ms) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}` : `${m}:${String(x).padStart(2, '0')}`;
};
const fmtMS = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec % 60)).padStart(2, '0')}`;
const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });

const vol = (w) => !w?.exercises ? 0 : w.exercises.reduce((s, ex) => s + ex.sets.filter(x => x.done).reduce((a, x) => a + (+x.w || 0) * (+x.r || 0), 0), 0);
const setCount = (w) => !w?.exercises ? 0 : w.exercises.reduce((n, ex) => n + ex.sets.filter(x => x.done).length, 0);

// Epley estimated one-rep max
const e1rm = (w, r) => { w = Number(w) || 0; r = Number(r) || 0; if (!w || !r) return 0; return r === 1 ? w : w * (1 + r / 30); };
// Best estimated 1RM for an exercise across history (optionally only before a timestamp)
const bestBefore = (name, history, beforeTs) => {
  let best = 0;
  for (const wk of history) {
    if (beforeTs && wk.startTime >= beforeTs) continue;
    const ex = wk.exercises.find(e => e.n === name);
    if (ex) for (const s of ex.sets) best = Math.max(best, e1rm(s.w, s.r));
  }
  return best;
};

/* ════════════════════════════════════════════════════════════════
   MOTION ENGINE — real demo photos (start ⇄ finish crossfade) with
   an articulated capsule-figure fallback for offline & custom moves.
═══════════════════════════════════════════════════════════════════ */
const IMG_BASE = 'https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/';

const STAND = { head:[52,27], chest:[52,54], pelvis:[52,100], elbow:[52,80], hand:[52,106], knee:[52,135], foot:[52,168] };
const P = (o) => ({ ...STAND, ...o });

const ARCHETYPES = {
  pressvert:  { load:'bar', dur:1500, frames:[ P({elbow:[63,69],hand:[59,47]}), P({elbow:[54,36],hand:[55,10]}) ] },
  presshoriz: { load:'bar', prop:'bench', dur:1500, frames:[
    P({head:[18,118],chest:[40,124],pelvis:[80,126],knee:[96,144],foot:[100,167],elbow:[46,146],hand:[38,128]}),
    P({head:[18,118],chest:[40,124],pelvis:[80,126],knee:[96,144],foot:[100,167],elbow:[40,102],hand:[38,90]}) ] },
  fly: { load:'db', prop:'bench', dur:1700, frames:[
    P({head:[18,118],chest:[40,124],pelvis:[80,126],knee:[96,144],foot:[100,167],elbow:[58,142],hand:[68,140]}),
    P({head:[18,118],chest:[40,124],pelvis:[80,126],knee:[96,144],foot:[100,167],elbow:[42,104],hand:[40,92]}) ] },
  pullvert: { load:'none', prop:'pullbar', dur:1600, frames:[
    P({hand:[55,18],elbow:[55,44],chest:[55,72],head:[55,48],pelvis:[55,112],knee:[59,138],foot:[56,158]}),
    P({hand:[55,18],elbow:[63,34],chest:[55,48],head:[56,24],pelvis:[55,88],knee:[62,114],foot:[58,136]}) ] },
  pullhoriz: { load:'bar', dur:1400, frames:[
    P({pelvis:[44,102],chest:[72,72],head:[87,57],knee:[46,134],foot:[48,168],elbow:[75,97],hand:[72,120]}),
    P({pelvis:[44,102],chest:[72,72],head:[87,57],knee:[46,134],foot:[48,168],elbow:[80,82],hand:[75,94]}) ] },
  squat: { load:'bar-back', dur:1800, frames:[
    P({elbow:[62,68],hand:[57,50]}),
    P({pelvis:[40,127],knee:[66,139],foot:[52,168],chest:[57,86],head:[63,61],elbow:[68,98],hand:[62,80]}) ] },
  hinge: { load:'bar', dur:1800, frames:[
    P({}),
    P({chest:[77,79],head:[91,63],pelvis:[40,97],knee:[47,131],foot:[50,168],elbow:[73,101],hand:[68,124]}) ] },
  lunge: { load:'db', dur:1700, frames:[
    P({knee2:[48,135],foot2:[48,168]}),
    P({pelvis:[56,120],chest:[56,74],head:[56,48],knee:[73,144],foot:[73,168],knee2:[38,150],foot2:[22,164],elbow:[56,98],hand:[56,122]}) ] },
  curl: { load:'db', dur:1400, frames:[ P({hand:[56,106],elbow:[52,80]}), P({hand:[63,57],elbow:[52,80]}) ] },
  extension: { load:'cable', dur:1300, frames:[ P({hand:[63,66],elbow:[52,82]}), P({hand:[59,104],elbow:[52,82]}) ] },
  lateralraise:{ load:'db', dur:1500, frames:[ P({}), P({elbow:[69,66],hand:[87,60]}) ] },
  frontraise: { load:'db', dur:1500, frames:[ P({}), P({elbow:[70,64],hand:[89,56]}) ] },
  rearfly: { load:'db', dur:1500, frames:[
    P({pelvis:[44,102],chest:[70,74],head:[85,59],knee:[46,134],foot:[48,168],elbow:[73,98],hand:[71,117]}),
    P({pelvis:[44,102],chest:[70,74],head:[85,59],knee:[46,134],foot:[48,168],elbow:[81,79],hand:[92,68]}) ] },
  shrug: { load:'db', dur:1200, frames:[
    P({elbow:[51,82],hand:[50,108]}),
    P({chest:[52,49],head:[52,22],elbow:[51,77],hand:[50,103]}) ] },
  calf: { load:'none', dur:1200, frames:[
    P({}),
    P({pelvis:[52,92],chest:[52,46],head:[52,19],knee:[52,128],elbow:[52,72],hand:[52,98]}) ] },
  legext: { load:'none', prop:'seat', dur:1500, frames:[
    P({pelvis:[44,116],chest:[40,72],head:[40,46],elbow:[43,96],hand:[45,116],knee:[66,120],foot:[62,151]}),
    P({pelvis:[44,116],chest:[40,72],head:[40,46],elbow:[43,96],hand:[45,116],knee:[66,120],foot:[95,114]}) ] },
  legcurl: { load:'none', prop:'benchlow', dur:1500, frames:[
    P({head:[12,116],chest:[34,120],pelvis:[66,122],elbow:[30,138],hand:[26,154],knee:[88,124],foot:[108,126]}),
    P({head:[12,116],chest:[34,120],pelvis:[66,122],elbow:[30,138],hand:[26,154],knee:[88,124],foot:[92,92]}) ] },
  hipthrust: { load:'bar-hip', prop:'benchleft', dur:1500, frames:[
    P({head:[14,104],chest:[27,114],pelvis:[52,142],knee:[74,128],foot:[78,167],elbow:[34,124],hand:[44,136]}),
    P({head:[14,102],chest:[27,112],pelvis:[55,113],knee:[76,120],foot:[78,167],elbow:[34,122],hand:[46,124]}) ] },
  ab: { load:'none', dur:1500, frames:[
    P({pelvis:[58,160],knee:[78,136],foot:[92,164],chest:[35,164],head:[20,157],elbow:[30,150],hand:[26,141]}),
    P({pelvis:[58,160],knee:[78,136],foot:[92,164],chest:[44,146],head:[33,133],elbow:[39,133],hand:[35,124]}) ] },
  generic: { load:'none', dur:2200, frames:[
    P({}),
    P({pelvis:[52,103],chest:[52,57],head:[52,30],knee:[52,137],elbow:[52,83],hand:[52,109]}) ] },
};

const KEYS = ['head','chest','pelvis','elbow','hand','knee','foot','elbow2','hand2','knee2','foot2'];
function resolveFrame(f) {
  const off = (p) => [p[0] - 4, p[1] - 3];
  return { ...f,
    elbow2: f.elbow2 || off(f.elbow), hand2: f.hand2 || off(f.hand),
    knee2:  f.knee2  || off(f.knee),  foot2: f.foot2 || off(f.foot) };
}

function Prop({ kind }) {
  const st = { fill: T.surfaceHi, stroke: T.borderHi, strokeWidth: 1.2 };
  if (kind === 'bench') return (<g>
    <rect x="16" y="132" width="84" height="7" rx="3" {...st} />
    <line x1="26" y1="139" x2="26" y2="168" stroke={T.borderHi} strokeWidth="3" />
    <line x1="88" y1="139" x2="88" y2="168" stroke={T.borderHi} strokeWidth="3" /></g>);
  if (kind === 'benchlow') return (<g>
    <rect x="6" y="130" width="106" height="7" rx="3" {...st} />
    <line x1="16" y1="137" x2="16" y2="168" stroke={T.borderHi} strokeWidth="3" />
    <line x1="98" y1="137" x2="98" y2="168" stroke={T.borderHi} strokeWidth="3" /></g>);
  if (kind === 'benchleft') return (<g>
    <rect x="2" y="118" width="30" height="7" rx="3" {...st} />
    <line x1="8" y1="125" x2="8" y2="168" stroke={T.borderHi} strokeWidth="3" />
    <line x1="26" y1="125" x2="26" y2="168" stroke={T.borderHi} strokeWidth="3" /></g>);
  if (kind === 'seat') return (<g>
    <line x1="28" y1="118" x2="25" y2="72" stroke={T.borderHi} strokeWidth="5" />
    <rect x="26" y="118" width="30" height="8" rx="2" {...st} />
    <line x1="41" y1="126" x2="41" y2="168" stroke={T.borderHi} strokeWidth="4" /></g>);
  if (kind === 'pullbar') return (<g>
    <line x1="26" y1="16" x2="84" y2="16" stroke={T.borderHi} strokeWidth="3.5" strokeLinecap="round" />
    <line x1="28" y1="16" x2="28" y2="2" stroke={T.borderHi} strokeWidth="2.5" />
    <line x1="82" y1="16" x2="82" y2="2" stroke={T.borderHi} strokeWidth="2.5" /></g>);
  return null;
}

function loadGlyph(load, pose) {
  const bar = (p, half) => <line x1={p[0] - half} y1={p[1]} x2={p[0] + half} y2={p[1]} stroke={T.text} strokeWidth="3.4" strokeLinecap="round" opacity="0.9" />;
  if (load === 'bar') return bar(pose.hand, 16);
  if (load === 'bar-back') return bar([pose.chest[0], pose.chest[1] - 3], 17);
  if (load === 'bar-hip') return bar([pose.pelvis[0], pose.pelvis[1] - 5], 17);
  if (load === 'db') { const [x, y] = pose.hand; return (<g opacity="0.9">
    <line x1={x - 8} y1={y} x2={x + 8} y2={y} stroke={T.text} strokeWidth="2.6" />
    <circle cx={x - 8} cy={y} r="3.2" fill={T.text} /><circle cx={x + 8} cy={y} r="3.2" fill={T.text} /></g>); }
  if (load === 'cable') return <line x1={pose.hand[0]} y1={pose.hand[1]} x2={pose.hand[0] + 4} y2={4} stroke={T.textMute} strokeWidth="1.4" strokeDasharray="3 3" />;
  return null;
}

function RangeOfMotion({ archetype = 'generic', size = 150, playing = true, accent = T.text }) {
  const arch = ARCHETYPES[archetype] || ARCHETYPES.generic;
  const A = useMemo(() => resolveFrame(arch.frames[0]), [archetype]);
  const B = useMemo(() => resolveFrame(arch.frames[1]), [archetype]);
  const [pose, setPose] = useState(A);
  const raf = useRef(0);
  useEffect(() => {
    setPose(A);
    if (!playing) return;
    const t0 = performance.now();
    const loop = (now) => {
      const el = (now - t0) % (arch.dur * 2);
      const ph = el < arch.dur ? el / arch.dur : 1 - (el - arch.dur) / arch.dur;
      const t = easeInOut(ph);
      const np = {};
      KEYS.forEach(k => { np[k] = lerpPt(A[k], B[k], t); });
      setPose(np);
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [archetype, playing]);

  const detail = size >= 70;
  const { head, chest, pelvis, elbow, hand, knee, foot, elbow2, hand2, knee2, foot2 } = pose;
  const W = 9;
  const limb = (pts, op = 1) => <polyline points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke={accent} strokeWidth={W} strokeLinecap="round" strokeLinejoin="round" opacity={op} />;
  const joint = (p) => <circle cx={p[0]} cy={p[1]} r="2.4" fill="rgba(0,0,0,0.38)" />;
  const upright = chest[1] < pelvis[1];
  return (
    <svg viewBox="0 0 112 180" width={size} height={size * 180 / 112} style={{ display: 'block' }}>
      <line x1="6" y1="172" x2="106" y2="172" stroke={T.border} strokeWidth="1.5" />
      {detail && <Prop kind={arch.prop} />}
      {detail && !arch.prop && upright && <ellipse cx={foot[0]} cy="171" rx="15" ry="2.6" fill={accent} opacity="0.1" />}
      {detail && limb([pelvis, knee2, foot2], 0.3)}
      {detail && limb([chest, elbow2, hand2], 0.3)}
      {limb([pelvis, knee, foot])}
      <line x1={chest[0]} y1={chest[1]} x2={pelvis[0]} y2={pelvis[1]} stroke={accent} strokeWidth={W + 1.5} strokeLinecap="round" />
      <line x1={chest[0]} y1={chest[1]} x2={head[0]} y2={head[1] + 6} stroke={accent} strokeWidth={W - 2} strokeLinecap="round" />
      <circle cx={head[0]} cy={head[1]} r="8.5" fill={accent} />
      {limb([chest, elbow, hand])}
      {detail && joint(elbow)}{detail && joint(knee)}
      {loadGlyph(arch.load, pose)}
    </svg>
  );
}

function ExerciseMedia({ ex, height = 200 }) {
  const [err, setErr] = useState(false);
  const [ready, setReady] = useState(false);
  if (!ex.img || err) return (
    <div style={{ display: 'grid', placeItems: 'center', padding: '10px 0 14px', background: T.bgEl, borderRadius: 16, border: `1px solid ${T.border}` }}>
      <RangeOfMotion archetype={ex.a} size={Math.round(height * 0.8)} playing accent={T.text} />
      <div style={{ fontSize: 10, color: T.textMute, letterSpacing: 1.5 }}>RANGE OF MOTION</div>
    </div>);
  const u = (i) => IMG_BASE + ex.img + '/' + i + '.jpg';
  const im = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain' };
  return (
    <div style={{ position: 'relative', width: '100%', height, background: '#fff', borderRadius: 16, overflow: 'hidden', border: `1px solid ${T.border}` }}>
      {!ready && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', color: '#aaa', fontSize: 12 }}>Loading…</div>}
      <img src={u(0)} onLoad={() => setReady(true)} onError={() => setErr(true)} alt="" style={im} />
      <img src={u(1)} onError={() => setErr(true)} alt="" className="xfade" style={im} />
      <div style={{ position: 'absolute', left: 10, bottom: 8, fontSize: 9, letterSpacing: 1.2, fontWeight: 700, color: '#fff', background: 'rgba(0,0,0,.55)', padding: '4px 8px', borderRadius: 6 }}>START ⇄ FINISH</div>
    </div>);
}

/* ════════════════════════════════════════════════════════════════
   BODY MAP — continuous muscular silhouette, tappable regions,
   recency heat, anatomical definition lines.
═══════════════════════════════════════════════════════════════════ */
function heatColor(level) {
  return [T.heat0, T.heat1, T.heat2, T.heat3][Math.min(3, level)];
}

const BD = { fill: '#0b0b0f', stroke: '#1e1e25', strokeWidth: 1 };
function BodyBase() {
  return (<g {...BD}>
    <circle cx="120" cy="38" r="22" />
    <path d="M106,58 L134,58 L139,78 L101,78 Z" />
    <path d="M84,80 C79,130 85,182 98,216 L142,216 C155,182 161,130 156,80 C132,69 108,69 84,80 Z" />
    <path d="M95,213 L145,213 C150,228 147,241 138,247 L102,247 C93,241 90,228 95,213 Z" />
    <path d="M61,88 C46,99 41,124 44,157 L40,205 C39,219 51,225 57,215 L65,165 C69,134 70,107 61,88 Z" />
    <path d="M179,88 C194,99 199,124 196,157 L200,205 C201,219 189,225 183,215 L175,165 C171,134 170,107 179,88 Z" />
    <ellipse cx="44" cy="228" rx="9" ry="12" />
    <ellipse cx="196" cy="228" rx="9" ry="12" />
    <path d="M96,244 C87,300 89,362 97,420 L114,420 C115,362 116,300 117,248 Z" />
    <path d="M144,244 C153,300 151,362 143,420 L126,420 C125,362 124,300 123,248 Z" />
    <ellipse cx="104" cy="430" rx="12" ry="8" />
    <ellipse cx="136" cy="430" rx="12" ry="8" />
  </g>);
}

function BodyMap({ view, heat, onSelect }) {
  const fillFor = (id) => heatColor(heat[id] || 0);
  const Region = ({ id, d, lines }) => (
    <g onClick={() => onSelect(id)} style={{ cursor: 'pointer' }} role="button" aria-label={REGION_LABEL[id]}>
      {d.map((p, i) => <path key={i} d={p} fill={fillFor(id)} stroke={T.borderHi} strokeWidth="1" style={{ transition: 'fill .3s ease' }} />)}
      {(lines || []).map((p, i) => <path key={'l' + i} d={p} fill="none" stroke="rgba(0,0,0,.45)" strokeWidth="1.5" strokeLinecap="round" />)}
    </g>
  );

  if (view === 'front') return (
    <svg viewBox="0 0 240 446" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', margin: '0 auto' }}>
      <BodyBase />
      <Region id="traps" d={["M97,70 Q120,60 143,70 L149,87 Q120,75 91,87 Z"]} />
      <Region id="shoulders" d={[
        "M54,92 C64,83 80,85 86,96 C89,109 81,121 67,121 C54,118 49,104 54,92 Z",
        "M186,92 C176,83 160,85 154,96 C151,109 159,121 173,121 C186,118 191,104 186,92 Z"]} />
      <Region id="chest" d={[
        "M89,93 C103,87 117,89 118,96 L118,137 C105,146 90,140 86,127 C83,114 84,101 89,93 Z",
        "M151,93 C137,87 123,89 122,96 L122,137 C135,146 150,140 154,127 C157,114 156,101 151,93 Z"]}
        lines={["M92,130 Q105,138 117,133", "M148,130 Q135,138 123,133"]} />
      <Region id="biceps" d={[
        "M51,123 C61,120 68,127 67,138 L61,169 C53,174 46,167 46,155 C45,143 47,131 51,123 Z",
        "M189,123 C179,120 172,127 173,138 L179,169 C187,174 194,167 194,155 C195,143 193,131 189,123 Z"]} />
      <Region id="forearms" d={[
        "M47,175 L61,173 L56,214 C51,221 44,217 43,208 Z",
        "M193,175 L179,173 L184,214 C189,221 196,217 197,208 Z"]} />
      <Region id="abs" d={["M102,142 C113,137 127,137 138,142 L135,209 Q120,217 105,209 Z"]}
        lines={["M120,143 L120,209", "M106,160 L134,160", "M105,176 L135,176", "M106,192 L134,192"]} />
      <Region id="quads" d={[
        "M97,250 C107,245 114,247 116,254 L113,330 C104,339 93,332 90,317 C87,293 91,267 97,250 Z",
        "M143,250 C133,245 126,247 124,254 L127,330 C136,339 147,332 150,317 C153,293 149,267 143,250 Z"]}
        lines={["M103,262 Q100,300 102,322", "M137,262 Q140,300 138,322"]} />
      <Region id="calves" d={[
        "M96,340 C104,335 110,339 109,348 L106,409 C100,416 93,409 92,396 C90,377 92,356 96,340 Z",
        "M144,340 C136,335 130,339 131,348 L134,409 C140,416 147,409 148,396 C150,377 148,356 144,340 Z"]} />
    </svg>
  );

  return (
    <svg viewBox="0 0 240 446" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block', margin: '0 auto' }}>
      <BodyBase />
      <Region id="traps" d={["M120,60 L150,79 L133,127 Q120,118 107,127 L90,79 Z"]} lines={["M120,72 L120,118"]} />
      <Region id="shoulders" d={[
        "M54,92 C64,83 80,85 86,96 C89,109 81,121 67,121 C54,118 49,104 54,92 Z",
        "M186,92 C176,83 160,85 154,96 C151,109 159,121 173,121 C186,118 191,104 186,92 Z"]} />
      <Region id="back" d={[
        "M91,107 C101,102 116,106 118,114 L118,182 C103,191 88,176 85,150 C83,133 85,117 91,107 Z",
        "M149,107 C139,102 124,106 122,114 L122,182 C137,191 152,176 155,150 C157,133 155,117 149,107 Z"]}
        lines={["M120,108 L120,184"]} />
      <Region id="triceps" d={[
        "M51,123 C61,120 68,127 67,138 L61,169 C53,174 46,167 46,155 C45,143 47,131 51,123 Z",
        "M189,123 C179,120 172,127 173,138 L179,169 C187,174 194,167 194,155 C195,143 193,131 189,123 Z"]} />
      <Region id="forearms" d={[
        "M47,175 L61,173 L56,214 C51,221 44,217 43,208 Z",
        "M193,175 L179,173 L184,214 C189,221 196,217 197,208 Z"]} />
      <Region id="lowerback" d={["M105,184 L135,184 L133,217 Q120,222 107,217 Z"]}
        lines={["M114,188 L114,214", "M126,188 L126,214"]} />
      <Region id="glutes" d={[
        "M98,219 C110,214 118,221 118,233 L116,253 C104,262 92,253 92,238 C92,229 94,223 98,219 Z",
        "M142,219 C130,214 122,221 122,233 L124,253 C136,262 148,253 148,238 C148,229 146,223 142,219 Z"]} />
      <Region id="hamstrings" d={[
        "M95,261 C105,257 114,259 115,266 L112,329 C103,338 92,329 90,313 C88,295 90,275 95,261 Z",
        "M145,261 C135,257 126,259 125,266 L128,329 C137,338 148,329 150,313 C152,295 150,275 145,261 Z"]}
        lines={["M103,272 L101,318", "M137,272 L139,318"]} />
      <Region id="calves" d={[
        "M96,340 C104,335 110,339 109,348 L106,409 C100,416 93,409 92,396 C90,377 92,356 96,340 Z",
        "M144,340 C136,335 130,339 131,348 L134,409 C140,416 147,409 148,396 C150,377 148,356 144,340 Z"]} />
    </svg>
  );
}

/* ════════════════════════════════════════════════════════════════
   ROOT
═══════════════════════════════════════════════════════════════════ */
export default function App() {
  const [tab, setTab] = useState('body');
  const [history, setHistory] = useState([]);
  const [active, setActive] = useState(null);
  const [custom, setCustom] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [weights, setWeights] = useState([]);
  const [settings, setSettings] = useState({ unit: 'kg', rest: 90, wInc: 2.5, rInc: 1 });
  const [restEnd, setRestEnd] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const [sheet, setSheet] = useState(null); // {type, ...}
  const [confirmState, setConfirmState] = useState(null);
  const ask = (message, onYes) => setConfirmState({ message, onYes });
  const [sync, setSync] = useState(SyncBus.state);
  useEffect(() => SyncBus.on((s) => setSync(s)), []);

  const [, force] = useState(0);
  useEffect(() => { const i = setInterval(() => force(x => x + 1), 1000); return () => clearInterval(i); }, []);

  const writing = useRef({});
  const seen = useRef({});
  useEffect(() => { (async () => {
    const [h, a, c, s, r, tp, wt] = await Promise.all([
      store.get(K.history, []), store.get(K.active, null), store.get(K.custom, []),
      store.get(K.settings, { unit: 'kg', rest: 90, wInc: 2.5, rInc: 1 }), store.get(K.rest, null),
      store.get(K.templates, []), store.get(K.weights, []),
    ]);
    setHistory(h); setActive(a); setCustom(c); setSettings(s); setRestEnd(r); setTemplates(tp); setWeights(wt); setLoaded(true);
  })(); }, []);

  // Live cross-device sync: remote changes flow into local state.
  // guardedSet only updates React state when the incoming value differs (by value)
  // from what we last wrote/saw — this prevents a write→remote→read→write echo loop.
  useEffect(() => {
    if (!loaded) return;
    const make = (key, setter, fb) => store.subscribe(key, (v) => {
      const val = (v === null || v === undefined) ? fb : v;
      const ser = JSON.stringify(val);
      if (seen.current[key] === ser) return;   // no real change — skip
      seen.current[key] = ser;
      setter(val);
    }, fb);
    const subs = [
      make(K.history, setHistory, []),
      make(K.active, setActive, null),
      make(K.custom, setCustom, []),
      make(K.settings, (v) => v && setSettings(v), null),
      make(K.templates, setTemplates, []),
      make(K.weights, setWeights, []),
      make(K.rest, setRestEnd, null),
    ].filter(Boolean);
    return () => subs.forEach(u => u && u());
  }, [loaded]);

  useEffect(() => { if (loaded) { seen.current[K.history] = JSON.stringify(history); store.set(K.history, history); } }, [history, loaded]);
  useEffect(() => { if (loaded) { seen.current[K.active] = JSON.stringify(active || null); active ? store.set(K.active, active) : store.del(K.active); } }, [active, loaded]);
  useEffect(() => { if (loaded) { seen.current[K.custom] = JSON.stringify(custom); store.set(K.custom, custom); } }, [custom, loaded]);
  useEffect(() => { if (loaded) { seen.current[K.templates] = JSON.stringify(templates); store.set(K.templates, templates); } }, [templates, loaded]);
  useEffect(() => { if (loaded) { seen.current[K.weights] = JSON.stringify(weights); store.set(K.weights, weights); } }, [weights, loaded]);
  useEffect(() => { if (loaded) { seen.current[K.settings] = JSON.stringify(settings); store.set(K.settings, settings); } }, [settings, loaded]);
  useEffect(() => { if (loaded) { seen.current[K.rest] = JSON.stringify(restEnd || null); restEnd ? store.set(K.rest, restEnd) : store.del(K.rest); } }, [restEnd, loaded]);

  // Full library = DB + custom, with stable ids
  const library = useMemo(() => {
    const base = EXERCISE_DB.map((e, idx) => ({ ...e, id: 'db' + idx }));
    const cust = custom.map(c => ({ ...c, custom: true }));
    return [...cust, ...base];
  }, [custom]);
  const byName = useMemo(() => Object.fromEntries(library.map(e => [e.n, e])), [library]);

  // Recency heat per region (how many days since last trained → level)
  const heat = useMemo(() => {
    const last = {};
    history.forEach(w => w.exercises.forEach(ex => {
      const meta = ex; const regs = [ex.m, ...(ex.sm || [])];
      regs.forEach(rg => { if (rg) last[rg] = Math.max(last[rg] || 0, w.startTime); });
    }));
    const now = Date.now(), day = 864e5, out = {};
    Object.entries(last).forEach(([rg, ts]) => {
      const d = (now - ts) / day;
      out[rg] = d <= 2 ? 3 : d <= 4 ? 2 : d <= 7 ? 1 : 0;
    });
    return out;
  }, [history]);

  const restLeft = restEnd ? Math.max(0, Math.ceil((restEnd - Date.now()) / 1000)) : 0;
  useEffect(() => { if (restEnd && restLeft === 0) { const t = setTimeout(() => setRestEnd(null), 4000); return () => clearTimeout(t); } }, [restEnd, restLeft]);

  /* ─── workout actions ─── */
  const startWorkout = (name = 'Workout', exMetas = []) => {
    setActive({ id: uid(), name, startTime: Date.now(), exercises: exMetas.map(snapshotEx) });
    setTab('workout');
  };
  function snapshotEx(meta) {
    return { key: uid(), n: meta.n, m: meta.m, sm: meta.sm || [], eq: meta.eq, a: meta.a, i: meta.i, img: meta.img,
      sets: [{ id: uid(), w: '', r: '', done: false }] };
  }
  const addExercises = (metas) => setActive(a => ({ ...a, exercises: [...a.exercises, ...metas.map(snapshotEx)] }));
  const removeExercise = (i) => setActive(a => ({ ...a, exercises: a.exercises.filter((_, x) => x !== i) }));
  const updateSet = (ei, si, patch) => setActive(a => {
    const ex = [...a.exercises]; ex[ei] = { ...ex[ei], sets: ex[ei].sets.map((s, i) => i === si ? { ...s, ...patch } : s) };
    return { ...a, exercises: ex };
  });
  const addSet = (ei) => setActive(a => {
    const ex = [...a.exercises]; const last = ex[ei].sets[ex[ei].sets.length - 1];
    ex[ei] = { ...ex[ei], sets: [...ex[ei].sets, { id: uid(), w: last?.w || '', r: last?.r || '', done: false }] };
    return { ...a, exercises: ex };
  });
  const removeSet = (ei, si) => setActive(a => {
    const ex = [...a.exercises]; ex[ei] = { ...ex[ei], sets: ex[ei].sets.filter((_, i) => i !== si) };
    return { ...a, exercises: ex };
  });
  const toggleDone = (ei, si) => {
    const s = active.exercises[ei].sets[si]; const willDone = !s.done;
    updateSet(ei, si, { done: willDone });
    if (willDone && settings.rest > 0) setRestEnd(Date.now() + settings.rest * 1000);
  };
  const finish = () => {
    const done = { ...active, endTime: Date.now(),
      exercises: active.exercises.map(ex => ({ ...ex, sets: ex.sets.filter(s => s.done && s.r) })).filter(ex => ex.sets.length) };
    if (!done.exercises.length) { ask('No sets were completed. Discard this workout?', () => { setActive(null); setRestEnd(null); }); return; }
    setHistory(h => [...h, done]); setActive(null); setRestEnd(null); setTab('history');
  };
  const cancel = () => ask('Discard this workout? All logged sets will be lost.', () => { setActive(null); setRestEnd(null); });

  const prevFor = useCallback((name) => {
    for (let i = history.length - 1; i >= 0; i--) {
      const ex = history[i].exercises.find(e => e.n === name);
      if (ex && ex.sets.length) return ex.sets;
    }
    return null;
  }, [history]);

  const prBaseline = useCallback((name) => bestBefore(name, history), [history]);
  const saveTemplate = (a) => setTemplates(t => [{ id: uid(), name: a.name || 'Template', exercises: a.exercises.map(({ n, m, sm, eq, a: ar, i, img }) => ({ n, m, sm, eq, a: ar, i, img })) }, ...t]);

  const addCustom = (n, m, eq, a) => { const ex = { n, m, sm: [], eq, lv: 'I', mech: 'C', a, i: 'Custom exercise.', custom: true }; setCustom(c => [ex, ...c]); return ex; };

  if (!loaded) return <div style={{ ...S.app, display: 'grid', placeItems: 'center' }}><span style={{ color: T.textDim }}>Loading…</span></div>;

  return (
    <div style={S.app}>
      <StyleTag />
      <SyncPill state={sync} />
      {/* Rest ring overlay */}
      {restEnd && restLeft > 0 && (
        <RestRing left={restLeft} total={settings.rest}
          onSkip={() => setRestEnd(null)}
          onAdjust={(d) => setRestEnd(e => Math.max(Date.now() + 1000, (e || Date.now()) + d * 1000))} />
      )}
      {restEnd && restLeft === 0 && (
        <div style={S.restDone} onClick={() => setRestEnd(null)} className="fade-in">REST DONE — TAP TO CLEAR</div>
      )}

      <div style={S.viewport} key={tab} className="view-enter">
        {tab === 'body' && (
          <BodyTab heat={heat} library={library} weights={weights} unit={settings.unit} onLogWeight={() => setSheet({ type: 'weight' })}
            onMuscle={(id) => setSheet({ type: 'muscle', region: id })}
            hasActive={!!active}
            onStart={() => active ? setTab('workout') : startWorkout()}
            onResume={() => setTab('workout')}
            active={active} />
        )}
        {tab === 'workout' && (
          <WorkoutTab active={active} settings={settings} prevFor={prevFor} ask={ask} templates={templates} prBaseline={prBaseline} onSaveTemplate={() => saveTemplate(active)} onStartTemplate={(t) => startWorkout(t.name, t.exercises)} onDeleteTemplate={(id) => ask('Delete this template?', () => setTemplates(ts => ts.filter(x => x.id !== id)))}
            onStart={() => startWorkout()}
            onAdd={() => setSheet({ type: 'picker' })}
            onRemoveExercise={removeExercise} onUpdateSet={updateSet}
            onAddSet={addSet} onRemoveSet={removeSet} onToggleDone={toggleDone}
            onRename={(n) => setActive(a => ({ ...a, name: n }))}
            onFinish={finish} onCancel={cancel}
            onOpenDetail={(ex) => setSheet({ type: 'detail', ex })} />
        )}
        {tab === 'history' && (
          <HistoryTab history={history} weights={weights} unit={settings.unit}
            onDelete={(id) => ask('Delete this workout from history?', () => setHistory(h => h.filter(w => w.id !== id)))}
            onRepeat={(w) => startWorkout(w.name, w.exercises)} />
        )}
        {tab === 'library' && (
          <LibraryTab library={library}
            onOpen={(ex) => setSheet({ type: 'detail', ex })}
            onNew={() => setSheet({ type: 'newExercise' })}
            onSettings={() => setSheet({ type: 'settings' })} />
        )}
        {tab === 'garmin' && <GarminTab />}
      </div>

      <Nav tab={tab} setTab={setTab} hasActive={!!active} />

      {/* SHEETS */}
      {sheet?.type === 'muscle' && (
        <MuscleSheet region={sheet.region} library={library}
          onClose={() => setSheet(null)}
          onOpen={(ex) => setSheet({ type: 'detail', ex, from: 'muscle', region: sheet.region })}
          onStart={(metas) => { active ? addExercises(metas) : startWorkout(REGION_LABEL[sheet.region], metas); setSheet(null); }}
          hasActive={!!active} />
      )}
      {sheet?.type === 'picker' && (
        <PickerSheet library={library}
          onClose={() => setSheet(null)}
          onPick={(metas) => { addExercises(metas); setSheet(null); }}
          onNew={() => setSheet({ type: 'newExercise', back: 'picker' })} />
      )}
      {sheet?.type === 'detail' && (
        <DetailSheet ex={sheet.ex} unit={settings.unit} history={history}
          onClose={() => setSheet(sheet.from === 'muscle' ? { type: 'muscle', region: sheet.region } : null)}
          onAdd={active ? () => { addExercises([sheet.ex]); setSheet(null); setTab('workout'); } : null} />
      )}
      {sheet?.type === 'newExercise' && (
        <NewExerciseSheet
          onClose={() => setSheet(sheet.back === 'picker' ? { type: 'picker' } : null)}
          onCreate={(n, m, eq, a) => { const ex = addCustom(n, m, eq, a); if (sheet.back === 'picker') { addExercises([ex]); } setSheet(sheet.back === 'picker' ? null : null); }} />
      )}
      {sheet?.type === 'settings' && (
        <SettingsSheet settings={settings} setSettings={setSettings} history={history} custom={custom}
          onClose={() => setSheet(null)}
          onExport={() => setSheet({ type: 'export' })}
          onClear={() => ask('Delete all workout history?', () => setHistory([]))}
          onReset={() => ask('Wipe everything — history, custom exercises and settings?', () => { setHistory([]); setCustom([]); setActive(null); setRestEnd(null); setSettings({ unit: 'kg', rest: 90, wInc: 2.5, rInc: 1 }); })} />
      )}
      {sheet?.type === 'export' && (
        <ExportSheet history={history} custom={custom} settings={settings} onClose={() => setSheet({ type: 'settings' })} />
      )}
      {sheet?.type === 'weight' && (
        <WeightSheet weights={weights} unit={settings.unit} onClose={() => setSheet(null)}
          onLog={(v) => setWeights(ws => [...ws, { ts: Date.now(), v }])}
          onDelete={(ts) => setWeights(ws => ws.filter(x => x.ts !== ts))} />
      )}
      <ConfirmDialog state={confirmState} onClose={() => setConfirmState(null)} />
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   BODY TAB
═══════════════════════════════════════════════════════════════════ */
const QUOTES = [
  'The set you skip never builds anything.',
  'Discipline is just remembering what you want.',
  'Show up — the body keeps the receipts.',
  'Heavy is a feeling. Strong is a habit.',
  "You don't find energy. You build it.",
  'One more rep is a decision, not a gift.',
  'Sore today. Capable tomorrow.',
  'Progress hides inside boring consistency.',
  'Train the body. The mind follows.',
  'Nobody warms up the bar for you.',
  'Small plates, stacked weekly, unrecognizable yearly.',
  'Your future self is watching this set.',
  'Earn the shower.',
  'Strength is rented. Training pays the rent.',
  'Start slow. Finish proud.',
  'The gym rewards attendance.',
  'Last set, best set.',
  'Quiet work. Loud results.',
  'Motivation starts the workout. Habit finishes it.',
  'Rest is part of the program, not an escape from it.',
];

function BodyTab({ heat, weights, unit, onLogWeight, onMuscle, onStart, hasActive }) {
  const latest = weights[weights.length - 1];
  const prevW = weights[weights.length - 2];
  const delta = latest && prevW ? latest.v - prevW.v : null;
  const [view, setView] = useState('front');
  const quote = useMemo(() => QUOTES[Math.floor(Date.now() / 864e5) % QUOTES.length], []); // cycles daily
  return (
    <div style={{ padding: '20px 18px 12px' }}>
      <div style={S.h1}>Body</div>
      <div className="fade-in" style={{ fontSize: 13.5, color: T.textDim, marginTop: 6, fontStyle: 'italic', lineHeight: 1.5 }}>
        “{quote}”
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', margin: '14px auto 4px', width: 'fit-content', background: T.surfaceHi, borderRadius: 10, padding: 3 }}>
        {['front', 'back'].map(v => (
          <button key={v} onClick={() => setView(v)} style={{ ...S.segBtn, background: view === v ? T.gold : 'transparent', color: view === v ? '#000' : T.textDim }}>
            {v === 'front' ? 'Front' : 'Back'}
          </button>
        ))}
      </div>

      <div style={{ perspective: 1200 }}>
        <div style={{ position: 'relative', height: 'min(46vh, 400px)', transformStyle: 'preserve-3d', transition: 'transform .6s cubic-bezier(.35,.7,.25,1)', transform: view === 'back' ? 'rotateY(180deg)' : 'rotateY(0deg)' }}>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', pointerEvents: view === 'front' ? 'auto' : 'none' }}>
            <BodyMap view="front" heat={heat} onSelect={onMuscle} />
          </div>
          <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden', transform: 'rotateY(180deg)', pointerEvents: view === 'back' ? 'auto' : 'none' }}>
            <BodyMap view="back" heat={heat} onSelect={onMuscle} />
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, margin: '8px 0 16px', fontSize: 10, color: T.textMute, letterSpacing: 0.5 }}>
        <span>RECOVERED</span>
        {[0, 1, 2, 3].map(l => <span key={l} style={{ width: 16, height: 8, borderRadius: 2, background: heatColor(l) }} />)}
        <span>TRAINED TODAY</span>
      </div>

      <div style={{ ...S.weekCard, display: 'flex', alignItems: 'center', margin: '0 0 12px', padding: '12px 16px' }}>
        <div style={{ flex: 1 }}>
          <div style={S.statLabel}>BODY WEIGHT</div>
          <div style={{ fontFamily: FM, fontSize: 22, fontWeight: 700, marginTop: 2 }}>
            {latest ? latest.v.toFixed(1) : '—'}<span style={{ fontSize: 12, color: T.textDim, marginLeft: 4 }}>{unit}</span>
            {delta !== null && delta !== 0 && <span style={{ fontSize: 12, marginLeft: 10, color: T.textDim }}>{delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}</span>}
          </div>
        </div>
        <button style={{ background: T.gold, color: '#000', border: 'none', borderRadius: 9, padding: '10px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FB }} onClick={onLogWeight}>Log</button>
      </div>

      <button style={S.primaryBtn} onClick={onStart}>{hasActive ? 'Resume workout' : 'Start empty workout'}</button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   WORKOUT TAB
═══════════════════════════════════════════════════════════════════ */
function WorkoutTab({ active, settings, prevFor, ask, templates, prBaseline, onSaveTemplate, onStartTemplate, onDeleteTemplate, onStart, onAdd, onRemoveExercise, onUpdateSet, onAddSet, onRemoveSet, onToggleDone, onRename, onFinish, onCancel, onOpenDetail }) {
  if (!active) {
    return (
      <div style={{ padding: '20px 18px 24px' }}>
        <div style={S.h1}>Workout</div>
        <div style={S.sub}>Start fresh, or launch a saved template.</div>
        <button style={{ ...S.primaryBtn, marginTop: 14 }} onClick={onStart}>Start empty workout</button>
        {templates.length > 0 && (<>
          <div style={S.sectionLabel}>TEMPLATES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {templates.map(t => (
              <div key={t.id} style={{ ...S.card, display: 'flex', alignItems: 'center', gap: 10, padding: '12px 12px' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{t.name}</div>
                  <div style={{ fontSize: 11, color: T.textDim, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.exercises.map(e => e.n).join(' · ')}</div>
                </div>
                <button style={{ background: T.gold, color: '#000', border: 'none', borderRadius: 9, padding: '9px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: FB }} onClick={() => onStartTemplate(t)}>Start</button>
                <button style={{ ...S.iconBtn, color: T.textMute }} onClick={() => onDeleteTemplate(t.id)} aria-label="Delete template"><X size={16} /></button>
              </div>
            ))}
          </div>
        </>)}
      </div>
    );
  }
  const elapsed = Date.now() - active.startTime;
  const doneSets = setCount(active);
  const allSets = active.exercises.reduce((n, e) => n + e.sets.length, 0);
  return (
    <div style={{ padding: '14px 0 18px' }}>
      <div style={{ padding: '0 16px' }}>
        <input value={active.name} onChange={e => onRename(e.target.value)} style={S.titleInput} />
        <div style={S.statsRow}>
          <Stat label="TIME" value={fmtClock(elapsed)} />
          <Stat label="VOLUME" value={Math.round(vol(active)).toLocaleString()} unit={settings.unit} />
          <Stat label="SETS" value={`${doneSets}/${allSets}`} />
        </div>
      </div>

      <div style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
        {active.exercises.map((ex, ei) => (
          <ActiveExercise key={ex.key} ex={ex} settings={settings} prev={prevFor(ex.n)} prBase={prBaseline(ex.n)}
            onOpenDetail={() => onOpenDetail(ex)}
            onRemove={() => ask(`Remove ${ex.n} from this workout?`, () => onRemoveExercise(ei))}
            onUpdateSet={(si, p) => onUpdateSet(ei, si, p)}
            onAddSet={() => onAddSet(ei)} onRemoveSet={(si) => onRemoveSet(ei, si)}
            onToggle={(si) => onToggleDone(ei, si)} />
        ))}
        <button style={S.dashBtn} onClick={onAdd}>+ Add exercise</button>
        <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
          <button style={S.ghostBtn} onClick={onCancel}>Discard</button>
          <button style={S.finishBtn} onClick={onFinish}>Finish</button>
        </div>
        <SaveTemplateBtn onSave={onSaveTemplate} />
      </div>
    </div>
  );
}

function SaveTemplateBtn({ onSave }) {
  const [saved, setSaved] = useState(false);
  return (
    <button style={{ width: '100%', marginTop: 2, padding: 11, background: 'transparent', border: 'none', color: saved ? T.gold : T.textDim, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB }}
      onClick={() => { onSave(); setSaved(true); setTimeout(() => setSaved(false), 1600); }}>
      {saved ? 'Template saved ✓' : 'Save as template'}
    </button>
  );
}

function Stat({ label, value, unit }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={S.statLabel}>{label}</div>
      <div style={{ fontFamily: FM, fontSize: 21, fontWeight: 600, letterSpacing: -0.5, marginTop: 2 }}>
        {value}{unit && <span style={{ fontSize: 12, color: T.textDim, marginLeft: 3 }}>{unit}</span>}
      </div>
    </div>
  );
}

function ActiveExercise({ ex, settings, prev, prBase, onOpenDetail, onRemove, onUpdateSet, onAddSet, onRemoveSet, onToggle }) {
  const [menu, setMenu] = useState(false);
  const [showAnim, setShowAnim] = useState(false);
  return (
    <div style={S.card}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '12px 12px 8px', position: 'relative' }}>
        <button onClick={() => setShowAnim(s => !s)} style={S.animThumb} aria-label="Show motion">
          <RangeOfMotion archetype={ex.a} size={40} playing={showAnim} accent={T.textDim} />
        </button>
        <button onClick={onOpenDetail} style={{ flex: 1, minWidth: 0, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginLeft: 10 }}>
          <div style={{ fontWeight: 700, fontSize: 16, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.n}</div>
          <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{REGION_LABEL[ex.m]} · {ex.eq}</div>
        </button>
        <button style={S.iconBtn} onClick={() => setMenu(m => !m)}><MoreHorizontal size={20} /></button>
        {menu && (<><div style={S.backdrop} onClick={() => setMenu(false)} /><div style={S.menu}>
          <button style={S.menuItem} onClick={() => { setMenu(false); onOpenDetail(); }}>View form & motion</button>
          <button style={{ ...S.menuItem, color: T.danger }} onClick={() => { setMenu(false); onRemove(); }}>Remove</button>
        </div></>)}
      </div>

      {showAnim && (
        <div style={{ padding: '2px 8px 10px' }} className="fade-in">
          <ExerciseMedia ex={ex} height={150} />
        </div>
      )}

      <div style={S.setHead}>
        <span style={{ width: 30, textAlign: 'center' }}>SET</span>
        <span style={{ flex: 1, paddingLeft: 4 }}>PREVIOUS</span>
        <span style={{ width: 96, textAlign: 'center' }}>{settings.unit.toUpperCase()}</span>
        <span style={{ width: 96, textAlign: 'center' }}>REPS</span>
        <span style={{ width: 38, textAlign: 'center' }}>✓</span>
      </div>

      {ex.sets.map((s, si) => (
        <SetRow key={s.id} n={si + 1} s={s} prev={prev?.[si]} isPR={s.done && e1rm(s.w, s.r) > prBase} unit={settings.unit}
          wInc={settings.wInc} rInc={settings.rInc}
          onChange={(p) => onUpdateSet(si, p)} onToggle={() => onToggle(si)}
          onRemove={() => onRemoveSet(si)} />
      ))}
      <button style={S.addSet} onClick={onAddSet}>+ Add set</button>
    </div>
  );
}

function Stepper({ value, inc, onChange, done, width = 96 }) {
  const v = value === '' ? '' : Number(value);
  const set = (nv) => onChange(String(Math.max(0, Math.round(nv * 100) / 100)));
  return (
    <div style={{ width, display: 'flex', alignItems: 'center', gap: 2 }}>
      <button style={{ ...S.stepBtn, opacity: done ? 0.5 : 1 }} onClick={() => set((v || 0) - inc)} aria-label="decrease"><Minus size={15} strokeWidth={3} /></button>
      <input type="number" inputMode="decimal" value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="0"
        style={{ ...S.num, background: done ? 'transparent' : T.surfaceHi, color: value ? T.text : T.textMute }} />
      <button style={{ ...S.stepBtn, opacity: done ? 0.5 : 1 }} onClick={() => set((v || 0) + inc)} aria-label="increase"><Plus size={15} strokeWidth={3} /></button>
    </div>
  );
}

function SetRow({ n, s, prev, isPR, unit, wInc, rInc, onChange, onToggle, onRemove }) {
  return (
    <div style={{ ...S.setRow, background: s.done ? 'rgba(255,255,255,0.05)' : 'transparent' }}>
      <button onClick={onRemove} style={{ ...S.setNum, color: s.done ? T.gold : T.textDim }} title="Tap to remove set">{n}</button>
      <span style={{ flex: 1, paddingLeft: 4, fontSize: 12, color: T.textDim, fontFamily: FM, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {prev ? `${prev.w || 0}×${prev.r}` : '—'}{isPR && <span style={S.prPill}>PR</span>}
      </span>
      <Stepper value={s.w} inc={wInc} onChange={(w) => onChange({ w })} done={s.done} />
      <Stepper value={s.r} inc={rInc} onChange={(r) => onChange({ r })} done={s.done} />
      <button onClick={onToggle} className={s.done ? 'check-pop' : ''} style={{ ...S.check, background: s.done ? T.gold : T.surfaceHi, color: s.done ? '#000' : T.textMute }}>
        {s.done ? <Check size={19} strokeWidth={3.2} /> : <Circle size={13} strokeWidth={2.2} style={{ opacity: 0.55 }} />}
      </button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   REST RING
═══════════════════════════════════════════════════════════════════ */
function RestRing({ left, total, onSkip, onAdjust }) {
  const r = 26, circ = 2 * Math.PI * r;
  const pct = total > 0 ? left / total : 0;
  return (
    <div style={S.restBar} className="slide-up">
      <svg width="64" height="64" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke={T.border} strokeWidth="4" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={T.gold} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct)} transform="rotate(-90 32 32)"
          style={{ transition: 'stroke-dashoffset 1s linear' }} />
        <text x="32" y="37" textAnchor="middle" fontFamily={FM} fontSize="14" fontWeight="700" fill={T.text}>{fmtMS(left)}</text>
      </svg>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 10, color: T.textMute, letterSpacing: 1.5, fontWeight: 700 }}>RESTING</div>
        <div style={{ fontSize: 13, color: T.textDim }}>Next set in {fmtMS(left)}</div>
      </div>
      <button style={S.restBtn} onClick={() => onAdjust(-15)}>−15</button>
      <button style={S.restBtn} onClick={() => onAdjust(15)}>+15</button>
      <button style={{ ...S.restBtn, background: T.gold, color: '#000', borderColor: T.gold }} onClick={onSkip}>Skip</button>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   HISTORY TAB
═══════════════════════════════════════════════════════════════════ */
function HistoryTab({ history, weights, unit, onDelete, onRepeat }) {
  const sorted = [...history].reverse();
  const week = Date.now() - 7 * 864e5;
  const wk = history.filter(w => w.startTime >= week);
  const wkVols = new Array(8).fill(0);
  history.forEach(w => { const idx = Math.floor((Date.now() - w.startTime) / (7 * 864e5)); if (idx >= 0 && idx < 8) wkVols[7 - idx] += vol(w); });
  const wkLabels = wkVols.map((_, i) => i === 7 ? 'now' : `-${7 - i}w`);
  return (
    <div style={{ padding: '20px 18px 12px' }}>
      <div style={S.h1}>History</div>
      <div style={S.weekCard}>
        <div style={{ fontSize: 10, color: T.textMute, letterSpacing: 1.5, fontWeight: 700, marginBottom: 10 }}>LAST 7 DAYS</div>
        <div style={{ display: 'flex', gap: 26 }}>
          <Big v={wk.length} l="Sessions" />
          <Big v={wk.reduce((s, w) => s + setCount(w), 0)} l="Sets" />
          {(() => { const x = wk.reduce((s, w) => s + vol(w), 0); return <Big v={x >= 1000 ? Math.round(x / 1000) : Math.round(x)} suffix={x >= 1000 ? 'k' : ''} l={`${unit} volume`} />; })()}
        </div>
      </div>
      {history.length > 0 && (
        <div style={{ ...S.weekCard, margin: '0 0 16px' }}>
          <div style={{ fontSize: 10, color: T.textMute, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>VOLUME — LAST 8 WEEKS ({unit})</div>
          <BarsChart values={wkVols} labels={wkLabels} />
        </div>
      )}
      {weights.length >= 2 && (
        <div style={{ ...S.weekCard, margin: '0 0 16px' }}>
          <div style={{ fontSize: 10, color: T.textMute, letterSpacing: 1.5, fontWeight: 700, marginBottom: 8 }}>BODY WEIGHT ({unit})</div>
          <LineChart points={weights.slice(-30).map(x => x.v)} />
        </div>
      )}
      {!sorted.length ? (
        <div style={S.empty}>No sessions yet.<br /><span style={{ color: T.textMute, fontSize: 13 }}>Your logged workouts appear here.</span></div>
      ) : sorted.map(w => <HistCard key={w.id} w={w} history={history} unit={unit} onDelete={() => onDelete(w.id)} onRepeat={() => onRepeat(w)} />)}
    </div>
  );
}
function Big({ v, l, suffix }) {
  return <div><div style={{ fontFamily: FM, fontSize: 27, fontWeight: 700, letterSpacing: -1 }}>{v}{suffix && <span style={{ fontSize: 14, color: T.textDim }}>{suffix}</span>}</div><div style={{ fontSize: 11, color: T.textDim, marginTop: 3 }}>{l}</div></div>;
}
function HistCard({ w, history, unit, onDelete, onRepeat }) {
  const [open, setOpen] = useState(false);
  const prs = useMemo(() => {
    const s = new Set();
    w.exercises.forEach(ex => {
      const base = bestBefore(ex.n, history, w.startTime);
      let best = 0; ex.sets.forEach(x => { best = Math.max(best, e1rm(x.w, x.r)); });
      if (best > 0 && best > base) s.add(ex.n);
    });
    return s;
  }, [w, history]);
  return (
    <div style={{ ...S.card, marginBottom: 10 }}>
      <button style={S.histHead} onClick={() => setOpen(o => !o)}>
        <div style={{ flex: 1, textAlign: 'left' }}>
          <div style={{ fontSize: 11, color: T.textMute, fontFamily: FM }}>{fmtDate(w.startTime)} · {new Date(w.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
          <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{w.name}</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 12, color: T.textDim, fontFamily: FM }}>
            <span>{w.exercises.length} ex</span><span>·</span><span>{setCount(w)} sets</span><span>·</span>
            <span>{Math.round(vol(w)).toLocaleString()} {unit}</span><span>·</span><span>{fmtClock((w.endTime || w.startTime) - w.startTime)}</span>{prs.size > 0 && <><span>·</span><span style={{ color: T.gold, fontWeight: 700 }}>{prs.size} PR</span></>}
          </div>
        </div>
        <span style={{ color: T.textMute, lineHeight: 0 }}>{open ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</span>
      </button>
      {open && (
        <div style={{ borderTop: `1px solid ${T.border}`, padding: '6px 14px 12px' }} className="fade-in">
          {w.exercises.map((ex, i) => (
            <div key={i} style={{ padding: '8px 0', borderTop: i ? `1px solid ${T.border}` : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ fontSize: 14, fontWeight: 600 }}>{ex.n}</div>{prs.has(ex.n) && <span style={S.prPill}>PR</span>}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 5 }}>
                {ex.sets.map((s, j) => <span key={j} style={S.setPill}>{s.w || 0}×{s.r}</span>)}
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button style={S.smallBtn} onClick={onRepeat}>Repeat</button>
            <button style={{ ...S.smallBtn, color: T.danger }} onClick={onDelete}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   LIBRARY TAB
═══════════════════════════════════════════════════════════════════ */
function LibraryTab({ library, onOpen, onNew, onSettings }) {
  const [q, setQ] = useState(''); const [region, setRegion] = useState('All'); const [eq, setEq] = useState('All');
  const equipment = useMemo(() => ['All', ...Array.from(new Set(library.map(e => e.eq))).sort()], [library]);
  const list = useMemo(() => library
    .filter(e => region === 'All' || e.m === region)
    .filter(e => eq === 'All' || e.eq === eq)
    .filter(e => e.n.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.n.localeCompare(b.n)), [library, region, eq, q]);

  return (
    <div style={{ padding: '20px 18px 12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={S.h1}>Library</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...S.chipBtn, display: 'grid', placeItems: 'center' }} onClick={onSettings}><SettingsIcon size={17} /></button>
          <button style={{ ...S.chipBtn, background: T.gold, color: '#000' }} onClick={onNew}>+ New</button>
        </div>
      </div>
      <div style={{ fontSize: 12, color: T.textMute, marginBottom: 12 }}>{library.length} exercises</div>
      <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" style={S.search} />
      <ScrollChips items={['All', ...REGIONS.map(r => r.id)]} value={region} onChange={setRegion} labels={{ All: 'All', ...REGION_LABEL }} />
      <ScrollChips items={equipment} value={eq} onChange={setEq} />
      <div style={{ marginTop: 6 }}>
        {list.map(e => <ExRow key={e.id} e={e} onClick={() => onOpen(e)} />)}
        {!list.length && <div style={S.empty}>No matches.</div>}
      </div>
    </div>
  );
}

function ExRow({ e, onClick, right }) {
  return (
    <button style={S.exRow} onClick={onClick}>
      <div style={S.exThumb}><RangeOfMotion archetype={e.a} size={36} playing={false} accent={T.textMute} /></div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div style={{ fontSize: 15, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.n}</div>
        <div style={{ fontSize: 11, color: T.textDim, marginTop: 1 }}>{REGION_LABEL[e.m]} · {e.eq}{e.custom ? ' · Custom' : ''}</div>
      </div>
      {right || <ChevronRight size={16} color={T.textMute} />}
    </button>
  );
}

function ScrollChips({ items, value, onChange, labels }) {
  return (
    <div style={S.chipScroll}>
      {items.map(it => (
        <button key={it} onClick={() => onChange(it)} style={{ ...S.chip, background: value === it ? T.gold : T.surfaceHi, color: value === it ? '#000' : T.textDim, borderColor: value === it ? T.gold : T.border }}>
          {labels?.[it] || it}
        </button>
      ))}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   SHEETS
═══════════════════════════════════════════════════════════════════ */
function Sheet({ title, onClose, action, children }) {
  return (
    <div style={S.overlay} onClick={onClose}>
      <div style={S.sheet} className="slide-up" onClick={e => e.stopPropagation()}>
        <div style={S.sheetGrip} />
        <div style={S.sheetHead}>
          <button style={S.sheetCancel} onClick={onClose}>Close</button>
          <div style={{ fontWeight: 700, fontSize: 16 }}>{title}</div>
          <div style={{ width: 48, textAlign: 'right' }}>{action}</div>
        </div>
        {children}
      </div>
    </div>
  );
}

function MuscleSheet({ region, library, onClose, onOpen, onStart, hasActive }) {
  const [view, setView] = useState('primary');
  const primary = library.filter(e => e.m === region);
  const secondary = library.filter(e => e.m !== region && (e.sm || []).includes(region));
  const list = view === 'primary' ? primary : secondary;
  return (
    <Sheet title={REGION_LABEL[region]} onClose={onClose}>
      <div style={{ display: 'flex', gap: 0, margin: '4px 16px 8px', background: T.surfaceHi, borderRadius: 10, padding: 3, width: 'fit-content' }}>
        {[['primary', `Primary (${primary.length})`], ['secondary', `Assists (${secondary.length})`]].map(([k, l]) => (
          <button key={k} onClick={() => setView(k)} style={{ ...S.segBtn, fontSize: 13, background: view === k ? T.gold : 'transparent', color: view === k ? '#000' : T.textDim }}>{l}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 16px' }}>
        {list.map(e => <ExRow key={e.id} e={e} onClick={() => onOpen(e)} />)}
        {!list.length && <div style={S.empty}>No exercises here.</div>}
      </div>
    </Sheet>
  );
}

function PickerSheet({ library, onClose, onPick, onNew }) {
  const [q, setQ] = useState(''); const [region, setRegion] = useState('All');
  const [sel, setSel] = useState({});
  const list = library
    .filter(e => region === 'All' || e.m === region)
    .filter(e => e.n.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => a.n.localeCompare(b.n));
  const count = Object.values(sel).filter(Boolean).length;
  const toggle = (e) => setSel(s => ({ ...s, [e.id]: s[e.id] ? null : e }));
  const confirm = () => onPick(Object.values(sel).filter(Boolean));
  return (
    <Sheet title="Add exercises" onClose={onClose}
      action={<button style={S.sheetAction} onClick={onNew}>New</button>}>
      <div style={{ padding: '4px 14px 0' }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" style={S.search} autoFocus />
        <ScrollChips items={['All', ...REGIONS.map(r => r.id)]} value={region} onChange={setRegion} labels={{ All: 'All', ...REGION_LABEL }} />
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 14px 80px' }}>
        {list.map(e => (
          <ExRow key={e.id} e={e} onClick={() => toggle(e)}
            right={<span style={{ width: 26, height: 26, borderRadius: 7, display: 'grid', placeItems: 'center', background: sel[e.id] ? T.gold : T.surfaceHi, color: '#000', fontWeight: 700 }}>{sel[e.id] ? '✓' : ''}</span>} />
        ))}
      </div>
      {count > 0 && (
        <div style={S.sheetFooter}><button style={S.primaryBtn} onClick={confirm}>Add {count} exercise{count > 1 ? 's' : ''}</button></div>
      )}
    </Sheet>
  );
}

function DetailSheet({ ex, unit, history, onClose, onAdd }) {
  const best = bestBefore(ex.n, history || []);
  return (
    <Sheet title={ex.n} onClose={onClose}
      action={onAdd ? <button style={S.sheetAction} onClick={onAdd}>Add</button> : null}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 18px 24px' }}>
        <ExerciseMedia ex={ex} height={210} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '16px 0' }}>
          <Tag>{REGION_LABEL[ex.m]}</Tag>
          {(ex.sm || []).slice(0, 3).map(s => <Tag key={s} dim>{REGION_LABEL[s]}</Tag>)}
          <Tag>{ex.eq}</Tag>
          {ex.mech && <Tag dim>{ex.mech === 'C' ? 'Compound' : 'Isolation'}</Tag>}
          {ex.lv && <Tag dim>{{ B: 'Beginner', I: 'Intermediate', E: 'Advanced' }[ex.lv] || ''}</Tag>}
        </div>
        {best > 0 && (
          <div style={{ ...S.weekCard, margin: '0 0 16px', padding: '12px 16px' }}>
            <div style={S.statLabel}>BEST ESTIMATED 1RM</div>
            <div style={{ fontFamily: FM, fontSize: 24, fontWeight: 700, marginTop: 2 }}>{Math.round(best)}<span style={{ fontSize: 13, color: T.textDim, marginLeft: 4 }}>{unit}</span></div>
            <div style={{ fontSize: 11, color: T.textMute, marginTop: 4 }}>Epley estimate from your logged sets — weight × (1 + reps ÷ 30).</div>
          </div>
        )}
        <div style={S.statLabel}>HOW TO</div>
        <p style={{ fontSize: 14, lineHeight: 1.6, color: T.textDim, marginTop: 6 }}>{ex.i}</p>
      </div>
    </Sheet>
  );
}
function Tag({ children, dim }) {
  return <span style={{ fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 14, background: dim ? T.surfaceHi : T.gold, color: dim ? T.textDim : '#000', border: `1px solid ${dim ? T.border : T.gold}` }}>{children}</span>;
}

function NewExerciseSheet({ onClose, onCreate }) {
  const [n, setN] = useState(''); const [m, setM] = useState('chest'); const [eq, setEq] = useState('Barbell'); const [a, setA] = useState('presshoriz');
  const arches = Object.keys(ARCHETYPES);
  return (
    <Sheet title="New exercise" onClose={onClose}
      action={<button style={{ ...S.sheetAction, opacity: n.trim() ? 1 : 0.4 }} disabled={!n.trim()} onClick={() => n.trim() && onCreate(n.trim(), m, eq, a)}>Save</button>}>
      <div style={{ padding: 16, overflowY: 'auto' }}>
        <Field label="NAME"><input value={n} onChange={e => setN(e.target.value)} placeholder="e.g. Machine Pec Deck" style={S.search} autoFocus /></Field>
        <Field label="PRIMARY MUSCLE"><ScrollChips items={REGIONS.map(r => r.id)} value={m} onChange={setM} labels={REGION_LABEL} /></Field>
        <Field label="EQUIPMENT"><ScrollChips items={['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band']} value={eq} onChange={setEq} /></Field>
        <Field label="MOTION PATTERN (for fallback animation)"><ScrollChips items={arches} value={a} onChange={setA} /></Field>
        <div style={{ display: 'grid', placeItems: 'center', marginTop: 8, padding: 12, background: T.bgEl, borderRadius: 14, border: `1px solid ${T.border}` }}>
          <RangeOfMotion archetype={a} size={120} playing accent={T.text} />
        </div>
      </div>
    </Sheet>
  );
}
function Field({ label, children }) {
  return <div style={{ marginBottom: 16 }}><div style={S.statLabel}>{label}</div><div style={{ marginTop: 6 }}>{children}</div></div>;
}

function SettingsSheet({ settings, setSettings, history, custom, onClose, onExport, onClear, onReset }) {
  return (
    <Sheet title="Settings" onClose={onClose}>
      <div style={{ padding: 16, overflowY: 'auto' }}>
        <Field label="UNITS">
          <div style={{ display: 'flex', gap: 8 }}>
            {['kg', 'lbs'].map(u => <button key={u} onClick={() => setSettings(s => ({ ...s, unit: u, wInc: u === 'kg' ? 2.5 : 5 }))} style={{ ...S.bigToggle, background: settings.unit === u ? T.gold : T.surfaceHi, color: settings.unit === u ? '#000' : T.textDim }}>{u}</button>)}
          </div>
        </Field>
        <Field label="DEFAULT REST">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[0, 60, 90, 120, 150, 180].map(s => <button key={s} onClick={() => setSettings(p => ({ ...p, rest: s }))} style={{ ...S.bigToggle, flex: '1 1 28%', fontFamily: FM, fontSize: 14, background: settings.rest === s ? T.gold : T.surfaceHi, color: settings.rest === s ? '#000' : T.textDim }}>{s === 0 ? 'Off' : fmtMS(s)}</button>)}
          </div>
        </Field>
        <Field label="WEIGHT STEP">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[1, 2.5, 5, 10].map(s => <button key={s} onClick={() => setSettings(p => ({ ...p, wInc: s }))} style={{ ...S.bigToggle, flex: '1 1 22%', fontFamily: FM, fontSize: 14, background: settings.wInc === s ? T.gold : T.surfaceHi, color: settings.wInc === s ? '#000' : T.textDim }}>{s}</button>)}
          </div>
        </Field>
        <Field label="DATA">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button style={S.dataBtn} onClick={onExport}>Export data (CSV / JSON)</button>
            <button style={{ ...S.dataBtn, color: T.warn }} onClick={onClear}>Clear history</button>
            <button style={{ ...S.dataBtn, color: T.danger }} onClick={onReset}>Reset everything</button>
          </div>
          <div style={{ fontSize: 12, color: T.textMute, marginTop: 10 }}>{history.length} sessions · {custom.length} custom exercises</div>
        </Field>
      </div>
    </Sheet>
  );
}

function buildCSV(history, unit) {
  const esc = (x) => '"' + String(x).replace(/"/g, '""') + '"';
  const rows = [['date', 'time', 'workout', 'exercise', 'muscle', 'equipment', 'set', 'weight_' + unit, 'reps', 'volume_' + unit].join(',')];
  history.forEach(w => {
    const d = new Date(w.startTime);
    const date = d.toISOString().slice(0, 10);
    const time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    w.exercises.forEach(ex => ex.sets.forEach((s, i) => {
      rows.push([date, time, esc(w.name), esc(ex.n), REGION_LABEL[ex.m] || ex.m || '', ex.eq || '', i + 1, s.w || 0, s.r || 0, (Number(s.w) || 0) * (Number(s.r) || 0)].join(','));
    }));
  });
  return rows.join('\n');
}

function ExportSheet({ history, custom, settings, onClose }) {
  const [fmt, setFmt] = useState('csv');
  const [copied, setCopied] = useState(false);
  const taRef = useRef(null);
  const text = useMemo(() => fmt === 'csv'
    ? buildCSV(history, settings.unit)
    : JSON.stringify({ exportedAt: new Date().toISOString(), settings, customExercises: custom, history }, null, 2),
  [fmt, history, custom, settings]);

  const download = () => {
    try {
      const blob = new Blob([text], { type: fmt === 'csv' ? 'text/csv' : 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'gym-export-' + new Date().toISOString().slice(0, 10) + '.' + fmt;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } catch (e) {}
  };
  const copyAll = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); }
    catch {
      try { taRef.current?.focus(); taRef.current?.select(); document.execCommand('copy'); setCopied(true); } catch (e) {}
    }
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Sheet title="Export" onClose={onClose}>
      <div style={{ padding: '8px 16px 20px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', gap: 0, background: T.surfaceHi, borderRadius: 10, padding: 3, width: 'fit-content', marginBottom: 10 }}>
          {[['csv', 'CSV (Excel)'], ['json', 'JSON (full)']].map(([k, l]) => (
            <button key={k} onClick={() => setFmt(k)} style={{ ...S.segBtn, fontSize: 13, background: fmt === k ? T.gold : 'transparent', color: fmt === k ? '#000' : T.textDim }}>{l}</button>
          ))}
        </div>
        <div style={{ fontSize: 12, color: T.textDim, lineHeight: 1.5, marginBottom: 10 }}>
          {fmt === 'csv'
            ? 'One row per completed set — date, workout, exercise, muscle, weight, reps, volume. Paste straight into Excel or Google Sheets.'
            : 'Complete backup — settings, custom exercises and full history.'}
        </div>
        <textarea ref={taRef} readOnly value={text} onFocus={e => e.target.select()}
          style={{ width: '100%', height: 220, background: T.surfaceHi, border: '1px solid ' + T.border, borderRadius: 12, color: T.text, fontFamily: FM, fontSize: 11, padding: 12, outline: 'none', resize: 'vertical', boxSizing: 'border-box', whiteSpace: 'pre' }} />
        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button style={{ ...S.ghostBtn, color: T.text }} onClick={download}>Download file</button>
          <button style={S.finishBtn} onClick={copyAll}>{copied ? 'Copied ✓' : 'Copy all'}</button>
        </div>
        <div style={{ fontSize: 11, color: T.textMute, marginTop: 10, lineHeight: 1.5 }}>
          If the download button does nothing (this preview can block file downloads), use Copy all and paste into Excel or a file.
        </div>
      </div>
    </Sheet>
  );
}

function BarsChart({ values, labels }) {
  const max = Math.max(1, ...values);
  const W = 320, H = 90, bw = W / values.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 16}`} width="100%">
      {values.map((v, i) => { const h = Math.round((v / max) * H); return (
        <g key={i}>
          <rect x={i * bw + 6} y={H - Math.max(2, h)} width={bw - 12} height={Math.max(2, h)} rx="3" fill={T.text} opacity={v === 0 ? 0.1 : 0.85} />
          <text x={i * bw + bw / 2} y={H + 12} textAnchor="middle" fontSize="8" fill={T.textMute} fontFamily={FM}>{labels[i]}</text>
        </g>); })}
    </svg>
  );
}

function LineChart({ points }) {
  if (points.length < 2) return null;
  const W = 320, H = 70, min = Math.min(...points), max = Math.max(...points), span = Math.max(0.1, max - min);
  const pts = points.map((v, i) => `${(i / (points.length - 1)) * (W - 12) + 6},${H - ((v - min) / span) * (H - 14) - 7}`).join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%">
      <polyline points={pts} fill="none" stroke={T.text} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="6" y="10" fontSize="9" fill={T.textMute} fontFamily={FM}>{max.toFixed(1)}</text>
      <text x="6" y={H - 1} fontSize="9" fill={T.textMute} fontFamily={FM}>{min.toFixed(1)}</text>
    </svg>
  );
}

function WeightSheet({ weights, unit, onLog, onDelete, onClose }) {
  const latest = weights[weights.length - 1];
  const [v, setV] = useState(latest ? latest.v : 70);
  const adj = (d) => setV(x => Math.max(20, Math.round((x + d) * 10) / 10));
  return (
    <Sheet title="Log body weight" onClose={onClose}>
      <div style={{ padding: '18px 16px 24px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 18 }}>
          <button style={S.weightBtn} onClick={() => adj(-0.1)}><Minus size={20} /></button>
          <div style={{ fontFamily: FM, fontSize: 44, fontWeight: 700, minWidth: 140, textAlign: 'center' }}>{v.toFixed(1)}<span style={{ fontSize: 16, color: T.textDim }}> {unit}</span></div>
          <button style={S.weightBtn} onClick={() => adj(0.1)}><Plus size={20} /></button>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 12 }}>
          {[-1, -0.5, 0.5, 1].map(d => <button key={d} style={S.restBtn} onClick={() => adj(d)}>{d > 0 ? '+' + d : d}</button>)}
        </div>
        <button style={{ ...S.primaryBtn, marginTop: 18 }} onClick={() => { onLog(v); onClose(); }}>Save</button>
        {weights.length > 0 && (<>
          <div style={S.sectionLabel}>RECENT</div>
          {weights.slice(-5).reverse().map((x) => (
            <div key={x.ts} style={{ display: 'flex', alignItems: 'center', padding: '8px 2px', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
              <span style={{ flex: 1, color: T.textDim }}>{fmtDate(x.ts)}</span>
              <span style={{ fontFamily: FM, fontWeight: 600 }}>{x.v.toFixed(1)} {unit}</span>
              <button style={{ ...S.iconBtn, width: 28, height: 28, color: T.textMute }} onClick={() => onDelete(x.ts)}><X size={14} /></button>
            </div>
          ))}
        </>)}
      </div>
    </Sheet>
  );
}

function ConfirmDialog({ state, onClose }) {
  if (!state) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', display: 'grid', placeItems: 'center', zIndex: 400, padding: 24 }} onClick={onClose}>
      <div className="pop-in" style={{ background: T.surfaceMax, border: '1px solid ' + T.borderHi, borderRadius: 18, padding: '22px 20px 16px', width: '100%', maxWidth: 340, boxShadow: '0 20px 60px rgba(0,0,0,.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5, textAlign: 'center' }}>{state.message}</div>
        <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
          <button style={S.ghostBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.finishBtn, flex: 1 }} onClick={() => { state.onYes(); onClose(); }}>Confirm</button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   NAV
═══════════════════════════════════════════════════════════════════ */
function SyncPill({ state }) {
  if (state === 'local') return null;
  const map = {
    synced:     { t: 'SYNCED', c: T.gold, dot: T.gold, Icon: Cloud },
    connecting: { t: 'CONNECTING', c: T.textDim, dot: T.textDim, Icon: Cloud },
    offline:    { t: 'OFFLINE', c: T.silver, dot: T.silver, Icon: CloudOff },
    error:      { t: 'SYNC ERROR', c: T.danger, dot: T.danger, Icon: CloudOff },
  };
  const m = map[state] || map.connecting;
  return (
    <div style={{ position: 'fixed', top: 'calc(8px + env(safe-area-inset-top,0px))', right: 12, zIndex: 70, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(8,8,10,0.85)', backdropFilter: 'blur(8px)', border: `1px solid ${T.border}`, borderRadius: 20, padding: '5px 11px 5px 9px' }}>
      <span className={state === 'synced' ? 'pulse' : ''} style={{ width: 7, height: 7, borderRadius: '50%', background: m.dot }} />
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: 1, color: m.c, fontFamily: FM }}>{m.t}</span>
    </div>
  );
}

function GarminTab() {
  const [offset, setOffset] = useState(0);
  const [cache, setCache] = useState(null);
  const [status, setStatus] = useState('loading');
  const [raw, setRaw] = useState(false);
  const dateStr = useMemo(() => new Date(Date.now() - offset * 864e5).toISOString().slice(0, 10), [offset]);

  useEffect(() => { (async () => setCache(await store.get(K.garmin, {})))(); }, []);

  const data = cache ? cache[dateStr] : undefined;

  const load = async (force) => {
    if (!cache) return;
    if (data && !force) { setStatus('ok'); return; }
    setStatus('loading');
    try {
      const r = await fetch('/api/garmin-sync?date=' + dateStr);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const j = await r.json();
      if (!j || j.error) throw new Error((j && j.error) || 'empty');
      const next = { ...cache, [dateStr]: j };
      setCache(next); store.set(K.garmin, next); setStatus('ok');
    } catch (e) { setStatus(data ? 'ok' : 'offline'); }
  };
  useEffect(() => { if (cache) load(false); }, [dateStr, cache]);

  const g = data || {};
  const dig = (path) => path.split('.').reduce((o, p) => (o == null ? undefined : o[p]), g);
  const pick = (...ks) => { for (const k of ks) { const v = dig(k); if (v !== undefined && v !== null) return v; } return null; };
  const sleepSec = pick('sleep.seconds', 'sleepSeconds', 'sleepTimeSeconds');
  const sleepH = sleepSec ? (sleepSec / 3600).toFixed(1) : pick('sleep.hours', 'sleepHours');
  const metrics = [
    ['STEPS', pick('steps', 'totalSteps'), ''],
    ['RESTING HR', pick('restingHR', 'restingHeartRate'), 'bpm'],
    ['CALORIES', pick('calories', 'totalKilocalories'), 'kcal'],
    ['ACTIVE CAL', pick('activeCalories', 'activeKilocalories'), 'kcal'],
    ['SLEEP', sleepH, 'h'],
    ['SLEEP SCORE', pick('sleep.score', 'sleepScore'), '/100'],
    ['BODY BATTERY', pick('bodyBattery.high', 'bodyBatteryHighestValue'), 'peak'],
    ['STRESS', pick('stress', 'averageStressLevel'), 'avg'],
  ].filter(x => x[1] !== null);
  const isToday = offset === 0;
  const navBtn = { ...S.chipBtn, display: 'grid', placeItems: 'center' };

  return (
    <div style={{ padding: '20px 18px 12px' }}>
      <div style={S.h1}>Garmin</div>
      <div style={S.sub}>Daily stats from your Garmin Connect account.</div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0 14px' }}>
        <button style={navBtn} onClick={() => setOffset(o => o + 1)} aria-label="Previous day"><ChevronLeft size={16} /></button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: FM, fontSize: 14, fontWeight: 700, color: isToday ? T.gold : T.text }}>
          {isToday ? 'Today' : fmtDate(Date.now() - offset * 864e5)}
        </div>
        <button style={{ ...navBtn, opacity: isToday ? 0.35 : 1 }} disabled={isToday} onClick={() => setOffset(o => Math.max(0, o - 1))} aria-label="Next day"><ChevronRight size={16} /></button>
        <button style={navBtn} onClick={() => load(true)} aria-label="Refresh"><RefreshCw size={15} /></button>
      </div>

      {status === 'loading' && <div style={S.empty}>Syncing with Garmin…</div>}

      {status === 'offline' && (
        <div style={{ ...S.card, borderLeft: `3px solid ${T.gold}`, padding: '16px 16px' }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: T.gold }}>Connects after deployment</div>
          <p style={{ fontSize: 13, color: T.textDim, lineHeight: 1.65, margin: '8px 0 0' }}>
            This preview can't reach Garmin — live stats need the small server function included in your deployment
            package (api/garmin-sync). Once the app is on Vercel with GARMIN_EMAIL and GARMIN_PASSWORD set as
            environment variables, this tab fills with steps, resting heart rate, sleep, body battery, stress and
            calories for any day. Full instructions are in the README.
          </p>
        </div>
      )}

      {status === 'ok' && metrics.length > 0 && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {metrics.map(([l, v, u]) => (
              <div key={l} style={{ ...S.card, padding: '14px 14px' }}>
                <div style={S.statLabel}>{l}</div>
                <div style={{ fontFamily: FM, fontSize: 26, fontWeight: 700, color: T.gold, marginTop: 4, letterSpacing: -0.5 }}>
                  {typeof v === 'number' ? Math.round(v).toLocaleString() : v}
                  {u && <span style={{ fontSize: 11, color: T.textDim, marginLeft: 4, fontWeight: 500 }}>{u}</span>}
                </div>
              </div>
            ))}
          </div>
          <button style={{ background: 'none', border: 'none', color: T.textMute, fontSize: 12, padding: '12px 2px', cursor: 'pointer', fontFamily: FB }} onClick={() => setRaw(r => !r)}>
            {raw ? 'Hide raw response' : 'View raw response'}
          </button>
          {raw && <pre style={{ background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 12, padding: 12, fontSize: 10, color: T.textDim, overflowX: 'auto', fontFamily: FM }}>{JSON.stringify(g, null, 2)}</pre>}
        </>
      )}

      {status === 'ok' && metrics.length === 0 && (
        <div style={S.empty}>
          Connected, but no recognizable metrics for this day.
          <div><button style={{ background: 'none', border: 'none', color: T.textDim, textDecoration: 'underline', cursor: 'pointer', fontFamily: FB, fontSize: 13, marginTop: 8 }} onClick={() => setRaw(r => !r)}>{raw ? 'Hide' : 'View'} raw response</button></div>
          {raw && <pre style={{ textAlign: 'left', background: T.surfaceHi, borderRadius: 12, padding: 12, fontSize: 10, color: T.textDim, overflowX: 'auto', fontFamily: FM, marginTop: 10 }}>{JSON.stringify(g, null, 2)}</pre>}
        </div>
      )}
    </div>
  );
}

function Nav({ tab, setTab, hasActive }) {
  const items = [
    ['body', 'Body', PersonStanding],
    ['workout', 'Workout', Dumbbell],
    ['history', 'History', HistoryIcon],
    ['library', 'Library', BookOpen],
    ['garmin', 'Garmin', Activity],
  ];
  return (
    <div style={S.nav}>
      {items.map(([id, label, Icon]) => {
        const on = tab === id;
        return (
          <button key={id} onClick={() => setTab(id)} style={{ ...S.navBtn, color: on ? T.gold : T.textMute }}>
            <span style={{ position: 'relative', display: 'block', lineHeight: 0 }}>
              <Icon size={22} strokeWidth={on ? 2.4 : 1.8} />
              {id === 'workout' && hasActive && <span style={S.navDot} />}
            </span>
            <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.3 }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   GLOBAL STYLE (animations)
═══════════════════════════════════════════════════════════════════ */
function StyleTag() {
  return <style>{`
    * { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
    input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
    input[type=number] { -moz-appearance: textfield; }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes viewEnter { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
    @keyframes checkPop { 0% { transform: scale(0.8); } 50% { transform: scale(1.12); } 100% { transform: scale(1); } }
    .fade-in { animation: fadeIn .35s ease both; }
    .view-enter { animation: viewEnter .32s cubic-bezier(.2,.7,.2,1) both; }
    .slide-up { animation: slideUp .3s cubic-bezier(.2,.8,.2,1) both; }
    .check-pop { animation: checkPop .25s ease; }
    @keyframes xfade { 0%, 22% { opacity: 0; } 45%, 77% { opacity: 1; } 96%, 100% { opacity: 0; } }
    .xfade { animation: xfade 3s ease-in-out infinite; }
    @keyframes popIn { from { transform: scale(.92); opacity: 0; } to { transform: scale(1); opacity: 1; } }
    .pop-in { animation: popIn .22s cubic-bezier(.2,.8,.3,1.2) both; }
    button { transition: transform .12s ease; }
    button:active { transform: scale(.96); }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
    .pulse { animation: pulse 2s ease-in-out infinite; }
    @media (prefers-reduced-motion: reduce) { .view-enter, .slide-up, .fade-in, .check-pop { animation: none !important; } }
    ::-webkit-scrollbar { width: 0; height: 0; }
  `}</style>;
}

/* ════════════════════════════════════════════════════════════════
   STYLES
═══════════════════════════════════════════════════════════════════ */
const S = {
  app: { background: T.bg, color: T.text, minHeight: '100vh', fontFamily: FB, maxWidth: 620, margin: '0 auto', paddingBottom: 78, position: 'relative', overflowX: 'hidden' },
  viewport: { minHeight: 'calc(100vh - 78px)' },
  h1: { fontSize: 32, fontWeight: 800, letterSpacing: -1.2 },
  sub: { fontSize: 13, color: T.textDim, marginTop: 4 },
  statLabel: { fontSize: 10, color: T.textMute, letterSpacing: 1.4, fontWeight: 700 },
  segBtn: { border: 'none', borderRadius: 8, padding: '8px 18px', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: FB, transition: 'all .2s' },
  primaryBtn: { width: '100%', background: 'linear-gradient(135deg, #e9d27c 0%, #d4af37 45%, #a8861f 100%)', color: '#1a1405', border: 'none', borderRadius: 14, padding: '17px', fontSize: 16, fontWeight: 800, letterSpacing: -0.2, cursor: 'pointer', fontFamily: FB, boxShadow: '0 6px 24px rgba(212,175,55,0.25)' },
  titleInput: { width: '100%', background: 'transparent', border: 'none', color: T.text, fontSize: 23, fontWeight: 800, letterSpacing: -0.6, padding: '2px 0', outline: 'none', fontFamily: FB },
  statsRow: { display: 'flex', gap: 14, marginTop: 6, paddingBottom: 12, borderBottom: `1px solid ${T.border}` },
  card: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '0 6px 8px', overflow: 'hidden' },
  animThumb: { width: 44, height: 44, borderRadius: 10, background: T.bgEl, border: `1px solid ${T.border}`, display: 'grid', placeItems: 'center', cursor: 'pointer', padding: 0, overflow: 'hidden' },
  iconBtn: { width: 32, height: 32, display: 'grid', placeItems: 'center', border: 'none', background: 'transparent', color: T.textDim, cursor: 'pointer', fontSize: 20, fontWeight: 700 },
  backdrop: { position: 'fixed', inset: 0, zIndex: 100 },
  menu: { position: 'absolute', top: 40, right: 8, background: T.surfaceMax, border: `1px solid ${T.borderHi}`, borderRadius: 10, padding: 4, zIndex: 101, minWidth: 180, boxShadow: '0 10px 30px rgba(0,0,0,.6)' },
  menuItem: { width: '100%', background: 'transparent', border: 'none', padding: '11px 12px', color: T.text, fontSize: 14, textAlign: 'left', cursor: 'pointer', borderRadius: 7, fontFamily: FB },
  setHead: { display: 'flex', alignItems: 'center', gap: 4, padding: '6px 8px', fontSize: 10, color: T.textMute, fontWeight: 700, letterSpacing: 1, borderBottom: `1px solid ${T.border}` },
  setRow: { display: 'flex', alignItems: 'center', gap: 4, padding: '5px 6px', borderRadius: 10, transition: 'background .15s' },
  setNum: { width: 30, textAlign: 'center', fontFamily: FM, fontWeight: 700, fontSize: 15, background: 'none', border: 'none', cursor: 'pointer', padding: '8px 0' },
  num: { width: 44, height: 38, border: 'none', borderRadius: 8, textAlign: 'center', fontSize: 16, fontWeight: 600, fontFamily: FM, outline: 'none', padding: 0, flex: 1, minWidth: 0 },
  stepBtn: { width: 24, height: 38, display: 'grid', placeItems: 'center', border: 'none', borderRadius: 7, background: T.surfaceMax, color: T.text, fontSize: 18, fontWeight: 700, cursor: 'pointer', flexShrink: 0, lineHeight: 1, padding: 0, fontFamily: FB },
  check: { width: 38, height: 38, border: 'none', borderRadius: 9, cursor: 'pointer', fontSize: 17, fontWeight: 700, display: 'grid', placeItems: 'center', transition: 'background .12s' },
  addSet: { width: '100%', margin: '6px 0 0', padding: 10, background: 'transparent', border: `1px dashed ${T.border}`, borderRadius: 9, color: T.textDim, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB },
  dashBtn: { width: '100%', padding: 15, background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 12, color: T.gold, fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: FB },
  ghostBtn: { flex: 1, padding: 15, background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 12, color: T.textDim, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FB },
  finishBtn: { flex: 2, padding: 15, background: T.gold, border: 'none', borderRadius: 12, color: '#000', fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: FB },
  restBar: { position: 'sticky', top: 0, zIndex: 60, display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: T.surface, borderBottom: `1px solid ${T.borderHi}` },
  restBtn: { background: T.surfaceHi, border: `1px solid ${T.border}`, color: T.textDim, padding: '8px 10px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: FM },
  restDone: { position: 'sticky', top: 0, zIndex: 60, background: T.gold, color: '#000', padding: 13, textAlign: 'center', fontWeight: 800, fontSize: 13, letterSpacing: 1, cursor: 'pointer' },
  weekCard: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '15px 18px', margin: '14px 0 16px' },
  empty: { textAlign: 'center', padding: 36, color: T.textDim, fontSize: 14, lineHeight: 1.6 },
  histHead: { display: 'flex', alignItems: 'center', width: '100%', background: 'transparent', border: 'none', padding: '13px 14px', cursor: 'pointer', color: T.text, fontFamily: FB },
  setPill: { fontFamily: FM, fontSize: 12, color: T.textDim, background: T.surfaceHi, padding: '3px 8px', borderRadius: 5 },
  smallBtn: { flex: 1, background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 9, padding: 11, color: T.text, fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FB },
  chipBtn: { background: T.surfaceHi, border: `1px solid ${T.border}`, color: T.text, padding: '8px 13px', borderRadius: 9, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: FB },
  search: { width: '100%', background: T.surfaceHi, border: `1px solid ${T.border}`, borderRadius: 11, padding: '13px 15px', color: T.text, fontSize: 15, outline: 'none', fontFamily: FB, boxSizing: 'border-box' },
  chipScroll: { display: 'flex', gap: 7, overflowX: 'auto', padding: '12px 0 4px', flexWrap: 'nowrap' },
  chip: { whiteSpace: 'nowrap', border: '1px solid', padding: '7px 13px', borderRadius: 16, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: FB, flexShrink: 0, transition: 'all .15s' },
  exRow: { display: 'flex', alignItems: 'center', gap: 11, width: '100%', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 12, padding: '9px 12px', cursor: 'pointer', fontFamily: FB, marginBottom: 7 },
  exThumb: { width: 40, height: 40, borderRadius: 9, background: T.bgEl, border: `1px solid ${T.border}`, display: 'grid', placeItems: 'center', overflow: 'hidden', flexShrink: 0 },
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', zIndex: 200 },
  sheet: { position: 'relative', background: T.bgEl, width: '100%', maxWidth: 620, maxHeight: '92vh', borderRadius: '20px 20px 0 0', border: `1px solid ${T.border}`, borderBottom: 'none', display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  sheetGrip: { width: 38, height: 4, borderRadius: 2, background: T.borderHi, margin: '8px auto 2px' },
  sheetHead: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 16px 12px', borderBottom: `1px solid ${T.border}` },
  sheetCancel: { background: 'none', border: 'none', color: T.textDim, fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: FB, padding: 0, width: 48, textAlign: 'left' },
  sheetAction: { background: 'none', border: 'none', color: T.gold, fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: FB, padding: 0 },
  sheetFooter: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, background: `linear-gradient(to top, ${T.bgEl} 70%, transparent)` },
  bigToggle: { flex: 1, padding: 14, borderRadius: 10, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 16, fontFamily: FB },
  dataBtn: { background: T.surface, border: `1px solid ${T.border}`, borderRadius: 11, padding: 14, color: T.text, fontSize: 14, fontWeight: 600, cursor: 'pointer', textAlign: 'left', fontFamily: FB },
  nav: { position: 'fixed', bottom: 0, left: 0, right: 0, maxWidth: 620, margin: '0 auto', background: 'rgba(8,8,10,0.92)', backdropFilter: 'blur(12px)', borderTop: `1px solid ${T.border}`, display: 'flex', paddingBottom: 'env(safe-area-inset-bottom,0px)', zIndex: 40 },
  navBtn: { flex: 1, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '11px 4px 13px', fontFamily: FB, transition: 'color .2s' },
  navDot: { position: 'absolute', top: -2, right: -4, width: 7, height: 7, borderRadius: '50%', background: T.gold, boxShadow: `0 0 0 2px ${T.bgEl}` },
  weightBtn: { width: 52, height: 52, borderRadius: 14, background: T.surfaceHi, border: `1px solid ${T.border}`, color: T.text, display: 'grid', placeItems: 'center', cursor: 'pointer' },
  prPill: { fontSize: 9, fontWeight: 800, letterSpacing: 0.5, background: T.gold, color: '#000', padding: '2px 6px', borderRadius: 5, marginLeft: 6 },
};
