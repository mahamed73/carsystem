import { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Service } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { Plus, Edit2, Trash2, X } from 'lucide-react';

export default function ServicesPage() {
  const { services, addService, updateService, deleteService } = useApp();
  const [showForm, setShowForm] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState({
    name: '', description: '', duration: 60, price: '', active: true,
  });

  const openNew = () => {
    setEditingService(null);
    setFormData({ name: '', description: '', duration: 60, price: '', active: true });
    setShowForm(true);
  };

  const openEdit = (service: Service) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      description: service.description,
      duration: service.duration,
      price: service.price?.toString() || '',
      active: service.active,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const service: Service = {
      id: editingService?.id || uuidv4(),
      name: formData.name,
      description: formData.description,
      duration: formData.duration,
      price: formData.price ? Number(formData.price) : undefined,
      active: formData.active,
    };

    if (editingService) {
      updateService(service);
    } else {
      addService(service);
    }
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الخدمة؟')) {
      deleteService(id);
    }
  };

  const toggleActive = (service: Service) => {
    updateService({ ...service, active: !service.active });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">الخدمات</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 bg-[#d4a853] hover:bg-[#c9952c] text-[#0a0f1a] font-bold px-4 py-2 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة خدمة
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(service => (
          <div key={service.id} className={`bg-[#111827] border rounded-xl p-5 ${service.active ? 'border-[#243044]' : 'border-red-500/30 opacity-60'}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-white font-bold">{service.name}</h3>
                <p className="text-gray-400 text-sm mt-1">{service.description}</p>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(service)} className="p-1.5 text-gray-400 hover:text-[#d4a853]">
                  <Edit2 className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(service.id)} className="p-1.5 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#243044]">
              <div className="flex gap-4 text-sm">
                <span className="text-gray-400">المدة: <span className="text-white">{service.duration} دقيقة</span></span>
                {service.price !== undefined && (
                  <span className="text-gray-400">السعر: <span className="text-white">{service.price} ر.س</span></span>
                )}
              </div>
              <button
                onClick={() => toggleActive(service)}
                className={`text-xs px-2 py-1 rounded-full ${service.active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}
              >
                {service.active ? 'نشطة' : 'معطلة'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-[#111827] border border-[#243044] rounded-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-white">
                {editingService ? 'تعديل الخدمة' : 'إضافة خدمة جديدة'}
              </h2>
              <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">اسم الخدمة *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">الوصف</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  rows={3}
                  className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1">المدة (دقيقة) *</label>
                  <input
                    type="number"
                    required
                    min={15}
                    value={formData.duration}
                    onChange={(e) => setFormData({...formData, duration: Number(e.target.value)})}
                    className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">السعر (اختياري)</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    className="w-full bg-[#1a2332] border border-[#243044] rounded-lg px-4 py-2.5 text-white focus:border-[#d4a853] focus:outline-none"
                    placeholder="ر.س"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.active}
                  onChange={(e) => setFormData({...formData, active: e.target.checked})}
                  className="rounded"
                />
                <label className="text-sm text-gray-400">نشطة</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-[#d4a853] hover:bg-[#c9952c] text-[#0a0f1a] font-bold py-2.5 rounded-lg transition-colors"
                >
                  {editingService ? 'حفظ التعديلات' : 'إضافة'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-[#243044] hover:bg-[#374151] text-white py-2.5 rounded-lg transition-colors"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
