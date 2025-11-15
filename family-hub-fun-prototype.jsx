import React, { useState } from 'react';
import { 
  Mic, Camera, ClipboardPaste, Calendar, Users, CheckSquare, Gift, 
  Home, Search, Inbox, X, ChevronRight, Check, Waves, Music, 
  Dribbble, Palette, Book, Utensils, Car, Heart, Star, Sparkles,
  Sun, Cloud, Umbrella
} from 'lucide-react';

const FamilyHubFun = () => {
  const [currentScreen, setCurrentScreen] = useState('today');
  const [inputText, setInputText] = useState('');
  const [showQuickAdd, setShowQuickAdd] = useState(false);

  // Activity icons and colors
  const activityConfig = {
    swimming: { icon: Waves, color: 'text-cyan-500', bg: 'bg-cyan-50', underline: 'decoration-cyan-400' },
    soccer: { icon: Dribbble, color: 'text-green-500', bg: 'bg-green-50', underline: 'decoration-green-400' },
    piano: { icon: Music, color: 'text-purple-500', bg: 'bg-purple-50', underline: 'decoration-purple-400' },
    ballet: { icon: Sparkles, color: 'text-pink-500', bg: 'bg-pink-50', underline: 'decoration-pink-400' },
    art: { icon: Palette, color: 'text-orange-500', bg: 'bg-orange-50', underline: 'decoration-orange-400' },
    reading: { icon: Book, color: 'text-amber-600', bg: 'bg-amber-50', underline: 'decoration-amber-400' },
    dinner: { icon: Utensils, color: 'text-red-500', bg: 'bg-red-50', underline: 'decoration-red-400' },
    pickup: { icon: Car, color: 'text-slate-600', bg: 'bg-slate-50', underline: 'decoration-slate-400' },
    birthday: { icon: Gift, color: 'text-fuchsia-500', bg: 'bg-fuchsia-50', underline: 'decoration-fuchsia-400' },
    health: { icon: Heart, color: 'text-rose-500', bg: 'bg-rose-50', underline: 'decoration-rose-400' },
    school: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-50', underline: 'decoration-yellow-400' },
  };

  // Person colors
  const personColors = {
    Oliver: { bg: 'bg-blue-500', light: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
    Ella: { bg: 'bg-pink-500', light: 'bg-pink-100', text: 'text-pink-700', border: 'border-pink-300' },
    Kate: { bg: 'bg-emerald-500', light: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
    Steven: { bg: 'bg-amber-500', light: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' },
  };

  const TodayScreen = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Friday
            </h1>
            <p className="text-gray-600 text-sm">November 14, 2025</p>
          </div>
          <div className="flex items-center space-x-2 text-gray-600">
            <Sun className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium">18°C</span>
          </div>
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        {/* Oliver's Day */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${personColors.Oliver.border}`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-10 h-10 ${personColors.Oliver.bg} rounded-full flex items-center justify-center text-white font-bold`}>
              O
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Oliver</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className={`p-2 ${activityConfig.swimming.bg} rounded-lg`}>
                <Waves className={`w-5 h-5 ${activityConfig.swimming.color}`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium underline decoration-4 ${activityConfig.swimming.underline} decoration-wavy`}>
                  Swimming 4:00pm
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-cyan-600" />
                  <span className="text-sm text-gray-600">Gear packed ✓</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium underline decoration-4 decoration-yellow-400 decoration-dotted">
                  Library book due
                </p>
                <span className="text-sm text-orange-600 font-medium">⚠️ Don't forget!</span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Car className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Pickup: <span className="font-medium underline decoration-2 decoration-blue-300">3:15pm</span> by Sarah
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Ella's Day */}
        <div className={`bg-white rounded-2xl p-4 shadow-sm border-2 ${personColors.Ella.border}`}>
          <div className="flex items-center space-x-3 mb-3">
            <div className={`w-10 h-10 ${personColors.Ella.bg} rounded-full flex items-center justify-center text-white font-bold`}>
              E
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Ella</h2>
          </div>

          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Star className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium underline decoration-4 decoration-yellow-400 decoration-wavy">
                  Show & Tell
                </p>
                <div className="mt-1">
                  <span className="text-sm bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                    Bring favourite toy 🧸
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className={`p-2 ${activityConfig.soccer.bg} rounded-lg`}>
                <Dribbble className={`w-5 h-5 ${activityConfig.soccer.color}`} />
              </div>
              <div className="flex-1">
                <p className={`font-medium underline decoration-4 ${activityConfig.soccer.underline} decoration-wavy`}>
                  Soccer 3:30pm
                </p>
                <div className="mt-1 flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-green-600" />
                  <span className="text-sm text-gray-600">Pack after school</span>
                </div>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 bg-slate-50 rounded-lg">
                <Car className="w-5 h-5 text-slate-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700">
                  Pickup: <span className="font-medium underline decoration-2 decoration-pink-300">5:00pm</span> Dad @ soccer field
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Family Event */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border-2 border-purple-200">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Tonight</h2>
          </div>

          <div className="flex items-start space-x-3">
            <div className={`p-2 ${activityConfig.dinner.bg} rounded-lg`}>
              <Utensils className={`w-5 h-5 ${activityConfig.dinner.color}`} />
            </div>
            <div className="flex-1">
              <p className={`font-medium underline decoration-4 ${activityConfig.dinner.underline} decoration-wavy`}>
                Dinner with the Smiths
              </p>
              <p className="text-sm text-gray-600 mt-1">
                6:30pm • Their place
              </p>
              <div className="mt-2 inline-flex items-center space-x-2 bg-gray-100 rounded-full px-3 py-1">
                <Users className="w-4 h-4 text-gray-600" />
                <span className="text-sm">Sarah: 0412 345 678</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">This Week</h3>
          <div className="grid grid-cols-4 gap-3">
            <div className="text-center">
              <div className="w-10 h-10 bg-cyan-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <Waves className="w-5 h-5 text-cyan-600" />
              </div>
              <span className="text-xs text-gray-600">2x</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <Dribbble className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-600">3x</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <Music className="w-5 h-5 text-purple-600" />
              </div>
              <span className="text-xs text-gray-600">1x</span>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-1">
                <Sparkles className="w-5 h-5 text-pink-600" />
              </div>
              <span className="text-xs text-gray-600">1x</span>
            </div>
          </div>
        </div>
      </div>

      <QuickAddButton onClick={() => setShowQuickAdd(true)} />
      <BottomNav active="today" setScreen={setCurrentScreen} />
    </div>
  );

  const WeekScreen = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          This Week
        </h1>
      </div>

      <div className="flex-1 p-4 space-y-3 overflow-auto">
        {/* Friday */}
        <DayCard 
          day="Fri" 
          date="14" 
          isToday={true}
          events={[
            { person: 'Oliver', activity: 'Swimming', time: '4pm', type: 'swimming' },
            { person: 'Ella', activity: 'Soccer', time: '3:30pm', type: 'soccer' },
            { person: 'Family', activity: 'Dinner @ Smiths', time: '6:30pm', type: 'dinner' },
          ]}
        />

        {/* Saturday */}
        <DayCard 
          day="Sat" 
          date="15"
          events={[
            { person: 'Ella', activity: 'Soccer game', time: '9am', type: 'soccer' },
            { person: 'Oliver', activity: 'Birthday party', time: '2pm', type: 'birthday' },
          ]}
        />

        {/* Sunday */}
        <DayCard 
          day="Sun" 
          date="16"
          events={[
            { person: 'Family', activity: 'Family day', time: 'All day', type: 'heart' },
          ]}
        />

        {/* Monday */}
        <DayCard 
          day="Mon" 
          date="17"
          events={[
            { person: 'Both', activity: 'School photos', time: '9am', type: 'school' },
            { person: 'Oliver', activity: 'Piano', time: '4pm', type: 'piano' },
          ]}
        />

        {/* Prep reminder */}
        <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="w-5 h-5 text-amber-600" />
            <h3 className="font-semibold text-amber-800">Don't Forget!</h3>
          </div>
          <p className="text-sm text-amber-700">
            Buy birthday gift for Oliver's party (Sat 2pm)
          </p>
        </div>
      </div>

      <QuickAddButton onClick={() => setShowQuickAdd(true)} />
      <BottomNav active="week" setScreen={setCurrentScreen} />
    </div>
  );

  const DayCard = ({ day, date, isToday, events }) => (
    <div className={`bg-white rounded-2xl p-4 shadow-sm ${isToday ? 'border-2 border-purple-400 ring-4 ring-purple-100' : 'border border-gray-200'}`}>
      <div className="flex items-start space-x-4">
        <div className={`text-center ${isToday ? 'text-purple-600' : 'text-gray-600'}`}>
          <div className="text-sm font-medium">{day}</div>
          <div className={`text-2xl font-bold ${isToday ? 'bg-purple-600 text-white rounded-full w-10 h-10 flex items-center justify-center' : ''}`}>
            {date}
          </div>
        </div>
        <div className="flex-1 space-y-2">
          {events.map((event, idx) => {
            const config = activityConfig[event.type] || activityConfig.school;
            const Icon = config.icon;
            return (
              <div key={idx} className="flex items-center space-x-2">
                <Icon className={`w-4 h-4 ${config.color}`} />
                <span className={`text-sm ${personColors[event.person]?.text || 'text-gray-700'} font-medium`}>
                  {event.person}
                </span>
                <span className={`text-sm underline decoration-2 ${config.underline}`}>
                  {event.activity}
                </span>
                <span className="text-xs text-gray-500">{event.time}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const PeopleScreen = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          People
        </h1>
        <div className="mt-2 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input 
            type="text" 
            placeholder="Search contacts..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-sm focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Oliver's Friends
        </div>
        
        <PersonCard 
          name="Jack"
          parents={['Ash', 'Amy']}
          phone="0412 345 678"
          notes="Soccer team, Wellington St"
          color="blue"
        />
        
        <PersonCard 
          name="Emma"
          parents={['Sarah', 'Mike']}
          phone="0423 456 789"
          notes="Same class, piano lessons"
          color="purple"
        />

        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">
          Ella's Friends
        </div>
        
        <PersonCard 
          name="Chloe"
          parents={['Lisa', 'Tom']}
          phone="0434 567 890"
          notes="Ballet together, birthday Dec 15"
          color="pink"
        />

        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider pt-2">
          Frequently Contacted
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Dribbble className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">Coach Tom</p>
                <p className="text-sm text-gray-500">Soccer</p>
              </div>
            </div>
            <span className="text-sm text-gray-600">0423 456 789</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Star className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-gray-800">School Office</p>
                <p className="text-sm text-gray-500">Main contact</p>
              </div>
            </div>
            <span className="text-sm text-gray-600">9876 5432</span>
          </div>
        </div>
      </div>

      <QuickAddButton onClick={() => setShowQuickAdd(true)} />
      <BottomNav active="people" setScreen={setCurrentScreen} />
    </div>
  );

  const PersonCard = ({ name, parents, phone, notes, color }) => {
    const colors = {
      blue: 'border-blue-200 bg-blue-50',
      purple: 'border-purple-200 bg-purple-50',
      pink: 'border-pink-200 bg-pink-50',
    };
    
    return (
      <div className={`bg-white rounded-2xl p-4 border-2 ${colors[color].split(' ')[0]}`}>
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-gray-800 text-lg">{name}</h3>
            <div className="mt-1 space-y-1">
              <p className="text-sm text-gray-600">
                Parents: <span className="font-medium underline decoration-2 decoration-gray-300">{parents.join(' & ')}</span>
              </p>
              <p className="text-sm text-gray-600">{phone}</p>
              <p className="text-xs text-gray-500 italic">{notes}</p>
            </div>
          </div>
          <div className={`p-2 ${colors[color].split(' ')[1]} rounded-lg`}>
            <Users className="w-5 h-5 text-gray-600" />
          </div>
        </div>
      </div>
    );
  };

  const ChecklistScreen = () => (
    <div className="flex flex-col h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      <div className="p-4 bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Checklists
        </h1>
      </div>

      <div className="flex-1 p-4 space-y-4 overflow-auto">
        <ChecklistCard 
          title="Swimming Kit"
          person="Oliver"
          icon={Waves}
          color="cyan"
          items={[
            { text: 'Swimmers', checked: true },
            { text: 'Towel', checked: true },
            { text: 'Goggles', checked: true },
            { text: 'Drink bottle', checked: false },
            { text: 'Snack', checked: false },
          ]}
        />

        <ChecklistCard 
          title="Soccer Gear"
          person="Ella"
          icon={Dribbble}
          color="green"
          items={[
            { text: 'Boots', checked: true },
            { text: 'Shin guards', checked: true },
            { text: 'Team shirt', checked: false },
            { text: 'Water bottle', checked: false },
            { text: 'Orange slices', checked: false },
          ]}
        />

        <ChecklistCard 
          title="School Morning"
          person="Both"
          icon={Star}
          color="yellow"
          items={[
            { text: 'Lunch packed', checked: false },
            { text: 'Homework in bag', checked: false },
            { text: 'Water bottles filled', checked: false },
            { text: 'Hats', checked: false },
          ]}
        />
      </div>

      <QuickAddButton onClick={() => setShowQuickAdd(true)} />
      <BottomNav active="checklists" setScreen={setCurrentScreen} />
    </div>
  );

  const ChecklistCard = ({ title, person, icon: Icon, color, items }) => {
    const colors = {
      cyan: { border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-600', check: 'text-cyan-500' },
      green: { border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-600', check: 'text-green-500' },
      yellow: { border: 'border-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-600', check: 'text-yellow-500' },
    };
    const c = colors[color];
    const completed = items.filter(i => i.checked).length;
    const total = items.length;
    const percentage = Math.round((completed / total) * 100);

    return (
      <div className={`bg-white rounded-2xl p-4 border-2 ${c.border}`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className={`p-2 ${c.bg} rounded-lg`}>
              <Icon className={`w-5 h-5 ${c.text}`} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{title}</h3>
              <p className="text-xs text-gray-500">{person}</p>
            </div>
          </div>
          <div className="text-right">
            <span className={`text-lg font-bold ${c.text}`}>{percentage}%</span>
            <p className="text-xs text-gray-500">{completed}/{total}</p>
          </div>
        </div>

        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex items-center space-x-3">
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${item.checked ? c.border + ' ' + c.bg : 'border-gray-300'}`}>
                {item.checked && <Check className={`w-3 h-3 ${c.check}`} />}
              </div>
              <span className={`text-sm ${item.checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const QuickAddButton = ({ onClick }) => (
    <button
      onClick={onClick}
      className="absolute bottom-20 right-4 w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transform hover:scale-105 transition-all"
    >
      <span className="text-white text-2xl">+</span>
    </button>
  );

  const QuickAddModal = () => (
    <div className="absolute inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 space-y-4 animate-slide-up">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-800">Quick Add</h2>
          <button onClick={() => setShowQuickAdd(false)} className="p-2">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="What do you want to remember?"
          className="w-full h-24 p-4 border-2 border-gray-200 rounded-2xl focus:border-purple-400 focus:outline-none resize-none"
        />

        <div className="grid grid-cols-3 gap-3">
          <button className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 rounded-2xl border-2 border-purple-200 transition-colors">
            <Mic className="w-6 h-6 text-purple-600 mb-1" />
            <span className="text-xs font-medium text-purple-900">Voice</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 rounded-2xl border-2 border-blue-200 transition-colors">
            <Camera className="w-6 h-6 text-blue-600 mb-1" />
            <span className="text-xs font-medium text-blue-900">Photo</span>
          </button>
          <button className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 rounded-2xl border-2 border-green-200 transition-colors">
            <ClipboardPaste className="w-6 h-6 text-green-600 mb-1" />
            <span className="text-xs font-medium text-green-900">Paste</span>
          </button>
        </div>

        <div className="text-xs text-gray-500 text-center italic">
          Try: "Oliver swimming every Monday 4pm" or "Jack's parents are Ash and Amy"
        </div>

        {inputText && (
          <button className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-medium rounded-2xl transition-colors">
            Add to Family Hub ✨
          </button>
        )}
      </div>
    </div>
  );

  const BottomNav = ({ active, setScreen }) => (
    <div className="border-t bg-white/90 backdrop-blur-sm">
      <div className="flex items-center justify-around p-2">
        <NavButton icon={Sun} label="Today" active={active === 'today'} onClick={() => setScreen('today')} />
        <NavButton icon={Calendar} label="Week" active={active === 'week'} onClick={() => setScreen('week')} />
        <NavButton icon={Users} label="People" active={active === 'people'} onClick={() => setScreen('people')} />
        <NavButton icon={CheckSquare} label="Lists" active={active === 'checklists'} onClick={() => setScreen('checklists')} />
      </div>
    </div>
  );

  const NavButton = ({ icon: Icon, label, active, onClick }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-2 rounded-lg transition-colors ${
        active ? 'text-purple-600' : 'text-gray-400 hover:text-gray-600'
      }`}
    >
      <Icon className="w-6 h-6 mb-1" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  );

  return (
    <div className="max-w-md mx-auto h-screen bg-gray-50 shadow-2xl flex flex-col relative overflow-hidden">
      {currentScreen === 'today' && <TodayScreen />}
      {currentScreen === 'week' && <WeekScreen />}
      {currentScreen === 'people' && <PeopleScreen />}
      {currentScreen === 'checklists' && <ChecklistScreen />}
      {showQuickAdd && <QuickAddModal />}
    </div>
  );
};

export default FamilyHubFun;
