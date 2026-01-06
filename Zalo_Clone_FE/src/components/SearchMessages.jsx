import React, { useState } from 'react';
import { Box, TextField, InputAdornment, Typography, IconButton, List, ListItem, ListItemText } from '@mui/material';
import { BiSearch, BiX } from 'react-icons/bi';
import { searchMessages } from '../api/messageApi';
import { toast } from 'react-toastify';

  const  SearchMessages = ({ userId, selectedContact, token, onSelectMessage, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim() || !token) {
      setSearchResults([]);
      toast.error('Vui lòng đăng nhập và nhập từ khóa tìm kiếm');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchMessages(
        userId,
        selectedContact.isGroup ? null : selectedContact.id,
        selectedContact.isGroup ? selectedContact.id : null,
        searchQuery,
        token
      );
      setSearchResults(results);
      toast.success('Tìm kiếm hoàn tất!');
    } catch (error) {
      console.error('Error searching messages:', error);
      toast.error(`Lỗi tìm kiếm: ${error.message}`);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    onClose();
  };

  return (
    <Box sx={{ p: 1, borderBottom: 1, borderColor: 'divider' }}>
      <TextField
        fullWidth
        placeholder="Tìm kiếm tin nhắn"
        variant="outlined"
        size="small"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <BiSearch />
            </InputAdornment>
          ),
          endAdornment: searchQuery && (
            <InputAdornment position="end">
              <IconButton onClick={handleClearSearch} disabled={isSearching}>
                <BiX />
              </IconButton>
            </InputAdornment>
          ),
        }}
        sx={{ mb: 2 }}
      />
      
      {searchResults.length > 0 && (
        <List sx={{ maxHeight: 200, overflow: 'auto' }}>
          {searchResults.map((message) => (
            <ListItem
              key={message.id}
              button
              onClick={() => onSelectMessage(message)}
            >
              <ListItemText
                primary={message.content}
                secondary={`Từ: ${selectedContact.isGroup ? (message.senderId === userId ? 'Bạn' : message.senderId) : message.senderId === userId ? 'Bạn' : selectedContact.name} - ${new Date(message.createAt).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      )}
      {searchQuery.trim() && searchResults.length === 0 && (
        <Typography textAlign="center" color="text.secondary">
          Không tìm thấy tin nhắn nào khớp với "{searchQuery}"
        </Typography>
      )}
    </Box>
  );
};

export default SearchMessages;