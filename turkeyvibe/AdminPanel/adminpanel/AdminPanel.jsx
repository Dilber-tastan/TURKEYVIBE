import React, { useState, useEffect } from 'react';
import './AdminPanel.css';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [events, setEvents] = useState([]);
  const [message, setMessage] = useState('');
  const [newEvent, setNewEvent] = useState({
    title: '',
    type: '',
    date: '',
    location: '',
    description: '',
    capacity: '',
  });
  const [editEvent, setEditEvent] = useState(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/users');
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        setMessage('Kullanıcılar yüklenirken bir hata oluştu!');
      }
    };

    const fetchEvents = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/events');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        setMessage('Etkinlikler yüklenirken bir hata oluştu!');
      }
    };

    fetchUsers();
    fetchEvents();
  }, []);

  const handleApprove = async (email) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      setMessage(data.message);
      setUsers(users.map(user => user.email === email ? { ...user, isApproved: true } : user));
    } catch (error) {
      setMessage('Kullanıcı onaylanırken bir hata oluştu!');
    }
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/admin/add-event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      const data = await response.json();
      setMessage(data.message);
      setEvents([...events, data.event]);
      setNewEvent({ title: '', type: '', date: '', location: '', description: '', capacity: '' });
    } catch (error) {
      setMessage('Etkinlik eklenirken hata!');
    }
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://localhost:5000/api/admin/update-event/${editEvent._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvent),
      });
      const data = await response.json();
      setMessage(data.message);
      setEvents(events.map(event => event._id === editEvent._id ? data.event : event));
      setEditEvent(null);
      setNewEvent({ title: '', type: '', date: '', location: '', description: '', capacity: '' });
    } catch (error) {
      setMessage('Etkinlik güncellenirken hata!');
    }
  };

  const handleDeleteEvent = async (id) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/delete-event/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      setMessage(data.message);
      setEvents(events.filter(event => event._id !== id));
    } catch (error) {
      setMessage('Etkinlik silinirken hata!');
    }
  };

  const handleEditEvent = (event) => {
    setEditEvent(event);
    setNewEvent({
      title: event.title,
      type: event.type,
      date: event.date.split('T')[0], // Tarih formatını düzelt
      location: event.location,
      description: event.description,
      capacity: event.capacity,
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEvent({ ...newEvent, [name]: value });
  };

  return (
    <div className="admin-panel-container">
      <div className="header">
        <h1 className="admin-title">TURKEYVIBE - Yönetici Paneli</h1>
      </div>
      <div className="admin-content">
        <h2 className="section-title">Kullanıcı Onayları</h2>
        {message && <p className="message">{message}</p>}
        <div className="user-list">
          {users.length === 0 ? (
            <p>Henüz kayıtlı kullanıcı yok.</p>
          ) : (
            users.map(user => (
              <div key={user.email} className="user-item">
                <div className="user-info">
                  <p><strong>E-posta:</strong> {user.email}</p>
                  <p><strong>Durum:</strong> {user.isApproved ? 'Onaylandı' : 'Onay Bekliyor'}</p>
                </div>
                {!user.isApproved && (
                  <button
                    className="approve-button"
                    onClick={() => handleApprove(user.email)}
                  >
                    Onayla
                  </button>
                )}
              </div>
            ))
          )}
        </div>

        <h2 className="section-title">Etkinlik Yönetimi</h2>
        <form onSubmit={editEvent ? handleUpdateEvent : handleAddEvent} className="event-form">
          <input
            type="text"
            name="title"
            value={newEvent.title}
            onChange={handleInputChange}
            placeholder="Etkinlik Başlığı"
            required
          />
          <input
            type="text"
            name="type"
            value={newEvent.type}
            onChange={handleInputChange}
            placeholder="Etkinlik Türü (Konser, Tiyatro vb.)"
            required
          />
          <input
            type="date"
            name="date"
            value={newEvent.date}
            onChange={handleInputChange}
            required
          />
          <input
            type="text"
            name="location"
            value={newEvent.location}
            onChange={handleInputChange}
            placeholder="Konum"
            required
          />
          <input
            type="text"
            name="description"
            value={newEvent.description}
            onChange={handleInputChange}
            placeholder="Açıklama"
            required
          />
          <input
            type="number"
            name="capacity"
            value={newEvent.capacity}
            onChange={handleInputChange}
            placeholder="Kapasite"
            required
          />
          <button type="submit">{editEvent ? 'Güncelle' : 'Ekle'}</button>
        </form>

        <div className="event-list">
          {events.length === 0 ? (
            <p>Henüz etkinlik yok.</p>
          ) : (
            events.map(event => (
              <div key={event._id} className="event-item">
                <div className="event-info">
                  <p><strong>Başlık:</strong> {event.title}</p>
                  <p><strong>Tür:</strong> {event.type}</p>
                  <p><strong>Tarih:</strong> {new Date(event.date).toLocaleString()}</p>
                  <p><strong>Konum:</strong> {event.location}</p>
                  <p><strong>Açıklama:</strong> {event.description}</p>
                  <p><strong>Kapasite:</strong> {event.capacity}</p>
                </div>
                <div className="event-actions">
                  <button
                    className="edit-button"
                    onClick={() => handleEditEvent(event)}
                  >
                    Düzenle
                  </button>
                  <button
                    className="delete-button"
                    onClick={() => handleDeleteEvent(event._id)}
                  >
                    Sil
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;