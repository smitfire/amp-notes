import React, { Component } from 'react'
import { API, graphqlOperation } from 'aws-amplify'
import { withAuthenticator } from '@aws-amplify/ui-react'
import { createNote, deleteNote, updateNote } from './graphql/mutations'
import { listNotes } from './graphql/queries'
import update from 'react-addons-update';
class App extends Component {
  state = {
    note: '',
    notes: []
  }

  async componentDidMount () {
    const result = await API.graphql(graphqlOperation(listNotes))
    this.setState({ notes: result.data.listNotes.items })
  }

  handleSetNote = ({ note, id }) => this.setState({ note, id })

  hasExistingNote = () => {
    const { notes, id } = this.state
    return id ? notes.findIndex(n => n.id === id) > -1 : false
  }

  handleChangeNote = evt =>
    this.setState({
      note: evt.target.value
    })

  handleDeleteNote = async noteId => {
    const { notes } = this.state
    const input = { id: noteId }
    const result = await API.graphql(graphqlOperation(deleteNote, { input }))
    const deletedNoteId = result.data.deleteNote.id
    const updatedNotes = notes.filter(note => note.id !== deletedNoteId)
    this.setState({ notes: updatedNotes })
  }

  handleAddNote = async evt => {
    const { note, notes } = this.state
    evt.preventDefault()
    if ( this.hasExistingNote() )
      this.handleUpdateNote()
    else {
      const input = { note }
      const result = await API.graphql( graphqlOperation( createNote, { input } ) )
      const newNote = result.data.createNote
      this.setState( { notes: [newNote, ...notes], note: '' } )
    }
  }

  handleUpdateNote = async () => {
    const { id, note, notes } = this.state
    const input = { id, note }
    const result = await API.graphql(graphqlOperation(updateNote, { input }))
    const updatedNote = result.data.updateNote
    const index = notes.findIndex( n => n.id === id )
    this.setState( {
      notes: update( notes, { [index]: { $set: updatedNote } } ),
      note: '', id: ''
    })
  }

  render () {
    const { id, note, notes } = this.state
    return (
      <div className='flex flex-column items-center justify-center pa3 bg-washed-red'>
        <h1 className='code f2-1'> Notetaker </h1>
        <form onSubmit={this.handleAddNote} className='mb3'>
          <input
            type='text'
            value={note}
            className='pa2 f4'
            placeholder='Write it bitch'
            onChange={this.handleChangeNote}
          />
          <button className='pa2 f4' type='submit'>
            {id ? "Update" : 'Add Note'}
          </button>
        </form>
        <div className='items-left pa3'>
          {notes.map(item => (
            <div className='flex items-left' key={item.id}>
              <li
                onClick={() => this.handleSetNote(item)}
                className='list pa1 f3'>
                {item.note}{' '}
              </li>
              <p
                className='pa1 f7'
                onClick={() => this.handleDeleteNote(item.id)}
              >
                X
              </p>
            </div>
          ))}
        </div>
      </div>
    )
  }
}

export default withAuthenticator(App)
