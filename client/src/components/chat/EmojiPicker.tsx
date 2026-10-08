import { useEffect, useRef, useState } from 'react';

const CATEGORIES: { id: string; icon: string; label: string; emojis: string[] }[] = [
  {
    id: 'smileys',
    icon: '😀',
    label: 'Smileys',
    emojis: '😀 😃 😄 😁 😆 😅 😂 🤣 🥲 ☺️ 😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😗 😙 😚 😋 😛 😝 😜 🤪 🤨 🧐 🤓 😎 🥸 🤩 🥳 😏 😒 😞 😔 😟 😕 🙁 ☹️ 😣 😖 😫 😩 🥺 😢 😭 😤 😠 😡 🤬 🤯 😳 🥵 🥶 😱 😨 😰 😥 😓 🤗 🤔 🫡 🤭 🤫 🤥 😶 😐 😑 😬 🙄 😯 😦 😧 😮 😲 🥱 😴 🤤 😪 😵 🤐 🥴 🤢 🤮 🤧 😷 🤒 🤕'.split(' '),
  },
  {
    id: 'gestures',
    icon: '👍',
    label: 'People',
    emojis: '👍 👎 👌 🤌 🤏 ✌️ 🤞 🫰 🤟 🤘 🤙 👈 👉 👆 👇 ☝️ ✋ 🤚 🖐️ 🖖 👋 🤝 🙏 ✍️ 💪 🙌 👏 🫶 👐 🤲 🫱 🫲 🧠 👀 👁️ 👅 👄'.split(' '),
  },
  {
    id: 'hearts',
    icon: '❤️',
    label: 'Hearts',
    emojis: '❤️ 🧡 💛 💚 💙 💜 🖤 🤍 🤎 💔 ❣️ 💕 💞 💓 💗 💖 💘 💝 💟 ♥️ 💯 💢 💥 💫 💦 💨 🔥 ✨ ⭐ 🌟 🎉 🎊'.split(' '),
  },
  {
    id: 'work',
    icon: '💼',
    label: 'Work',
    emojis: '💼 📁 📂 📄 📝 ✅ ☑️ ❌ ⚠️ ❓ ❗ 💡 📌 📎 🔗 🗓️ 📅 ⏰ ⏳ 🕐 💻 🖥️ ⌨️ 📱 📧 📨 📞 🔔 💰 💵 💳 🏆 🎯 🚀 📈 📉 🔍 🔒 🔑 🛠️ ⚙️ 🎨 🎓 📚 ✏️'.split(' '),
  },
  {
    id: 'nature',
    icon: '🌿',
    label: 'Nature',
    emojis: '🐶 🐱 🐭 🐹 🐰 🦊 🐻 🐼 🐨 🐯 🦁 🐮 🐷 🐸 🐵 🙈 🙉 🙊 🐔 🐧 🐦 🦉 🦋 🐝 🐢 🐍 🐬 🐳 🌸 🌹 🌻 🌼 🌲 🌴 🍀 🌈 ☀️ 🌙 ⭐ ⛅ ☔ ⚡ ❄️'.split(' '),
  },
  {
    id: 'food',
    icon: '🍕',
    label: 'Food',
    emojis: '🍎 🍊 🍋 🍌 🍉 🍇 🍓 🍒 🍑 🥭 🍍 🥥 🥑 🍅 🥕 🌽 🥔 🍞 🧀 🍳 🥞 🍔 🍟 🍕 🌭 🌮 🍜 🍝 🍣 🍱 🍛 🍚 🍦 🍩 🍪 🎂 🍫 🍿 ☕ 🍵 🥤 🍺 🍷'.split(' '),
  },
  {
    id: 'activity',
    icon: '⚽',
    label: 'Activity',
    emojis: '⚽ 🏀 🏈 ⚾ 🎾 🏐 🏏 🏸 🥊 🎮 🎲 🎯 🎵 🎶 🎤 🎧 🎸 🎬 📷 ✈️ 🚗 🚲 🏠 🏫 🌍 🗺️ 🎁 🎈'.split(' '),
  },
];

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  const [active, setActive] = useState(CATEGORIES[0].id);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      // clicks on the emoji toggle button are handled by the button itself
      if (ref.current && !ref.current.contains(target) && !target.closest('[data-emoji-toggle]')) {
        onClose();
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const category = CATEGORIES.find((c) => c.id === active) ?? CATEGORIES[0];

  return (
    <div
      ref={ref}
      className="absolute bottom-full left-2 right-2 mb-2 z-10 overflow-hidden rounded-xl border border-surface-300 bg-surface-100 shadow-2xl"
      role="dialog"
      aria-label="Emoji picker"
    >
      <div className="flex border-b border-surface-300 bg-surface-200/60">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            title={c.label}
            aria-label={c.label}
            onClick={() => setActive(c.id)}
            className={`flex-1 py-2 text-base transition-colors cursor-pointer ${
              active === c.id ? 'border-b-2 border-primary-500 bg-surface-200' : 'opacity-60 hover:opacity-100'
            }`}
          >
            {c.icon}
          </button>
        ))}
      </div>
      <div className="grid h-40 grid-cols-8 content-start gap-0.5 overflow-y-auto p-2">
        {category.emojis.map((emoji, i) => (
          <button
            key={`${emoji}-${i}`}
            type="button"
            onClick={() => onSelect(emoji)}
            className="flex h-8 w-8 items-center justify-center rounded-md text-xl hover:bg-surface-300 cursor-pointer"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
}
