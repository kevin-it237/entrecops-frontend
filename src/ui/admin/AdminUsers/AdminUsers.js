import React, { Component } from 'react';
import Modal from 'react-bootstrap/Modal';
import {DateFormat} from '../../utils/DateFormat';
import DatePicker from "react-datepicker";
import { Notification, addNotification } from '../../globalComponent/Notifications'
import "react-datepicker/dist/react-datepicker.css";
import Button from 'react-bootstrap/Button';
import axios from 'axios';
import Loader from '../../globalComponent/Loader';
import Hoc from '../../globalComponent/Hoc';

class AdminUser extends Component {

    state = {
        showModal: false,
        users: [],
        error: '',
        selectedUser: null,
        loading: true,
        deleting: false,
        sanctioning: false,
        date: new Date()
    }

    componentWillMount() {
        try {
            axios.get('/api/user/')
            .then(res => {
                this.setState({ users: res.data.users, loading: false, error: '' })
            })
            .catch(err => {
                this.setState({ error: "Une érreur s'est produite. Veuillez reéssayer.", loading: false })
            })
        } catch (error) {
            this.setState({ error: "Une érreur s'est produite. Veuillez reéssayer.", loading: false })
        }
    }

    deleteUser = (id) => {
        this.setState({ deleting: true, error: '' })
        axios.delete('api/user/' + id)
        .then(res => {
            let users = this.state.users.filter(user => {
                return user._id !== id;
            })
            this.setState({
                deleting: false,
                'error': '',
                users: users
            })
            this.setState({ deleting: false, error: '' })
        })
        .catch(err => {
            this.setState({ error: "Une érreur s'est produite. Veuillez reéssayer.", deleting: false })
        })
    }

    pickDate = (date) => {
        this.setState({ date: date })
    }

    openSanctionUserModal = (user) => {
        this.setState({selectedUser: user, showModal: true })
    }

    sanctionUser = () => {
        const { selectedUser } = this.state;
        if(this.state.date) {
            this.setState({ sanctioning: true, error: '', showModal: true })
            axios.patch('api/user/' + selectedUser._id + '/sanction/set', {sanctionDate: this.state.date})
            .then(res => {
                this.setState({ sanctioning: false, error: '', showModal: false, selectedUser: null });
                addNotification("success", "Sanction!", "Sanction ajoutée avec succès")
            })
            .catch(err => {
                addNotification("danger", "Sanction!", "Une érreur s'est produite. Veuillez reéssayer")
                this.setState({ error: "Une érreur s'est produite. Veuillez reéssayer.", sanctioning: false })
            })
        }
    }

    exportUsersListCSV = (data) => {
        let csvContent = "data:text/csv;charset=utf-8,";
        // Format our csv file content
        csvContent += "id , name, email, tel \r\n";
        data.forEach(function (rowArray, i) {
            let row = (i + 1) + " , " + rowArray.name + " , " + rowArray.email + " , " + rowArray.tel;
            csvContent += row + "\r\n";
        });

        // Creating the file
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "utilisateurs.csv");
        link.click();
    }

    render() {
        const {error, loading, deleting, users, sanctioning} = this.state;
        return (
            <Hoc>
                <Notification />
                <div className="container">
                    <div className="row mt-5">
                        <div className="col-sm-12">
                            <h3 className="title">UTILISATEURS</h3>
                        </div>
                        <div className="col-sm-12 text-center">
                            {error && error.length ? <div className="alert alert-danger" style={{ fontSize: "1.3rem" }}>{error}</div> : null}
                            {
                                loading ? <Loader />:
                                    users&&users.length ?
                                    <table className="table table-bordered">
                                        <thead className="thead-inverse thead-dark">
                                            <tr>
                                            <th>#</th>
                                            <th>Nom</th>
                                            <th>Email</th>
                                            <th>Création</th>
                                            <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                        {
                                            users.map((user, id) => (
                                                <tr key={id}>
                                                    <th scope="row">{id+1}</th>
                                                    <td>{user.name}</td>
                                                    <td>{user.email}</td>
                                                    <td className="date"><DateFormat date={user.date} /></td>
                                                    <td className="actions">
                                                        <button onClick={() => this.deleteUser(user._id)} className="btn btn-danger btn-md ml-3">{deleting ? <Loader />:"Supprimer"}</button>
                                                        <button onClick={() => this.openSanctionUserModal(user)} className="btn btn-dark btn-md ml-3">Sanctionner</button>
                                                    </td>
                                                </tr>
                                            ))
                                        }
                                        </tbody>
                                    </table>:null
                            }
                        </div>
                        <button className="btn btn-danger btn-lg export-btn" onClick={() => this.exportUsersListCSV(users)}>Exporter la liste</button>
                    </div>
                </div>

                 {/* Sanction user Modal */}
                 <Modal show={this.state.showModal} size="md" onHide={() => this.setState({showModal: !this.state.showModal})} >
                    <Modal.Header closeButton>
                    <Modal.Title>Définition de la sanction</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <div className="container">
                            <div className="row">
                                <div className="col-sm-12 pl-4 pr-4 mt-4 mb-3 d-flex flex-column justify-content-end">
                                    <h4>Choisissez la nouvelle date à laquelle cet utilisateur sera de nouveau autorisé à télécharger un coupon.</h4>
                                    <h4 className="py-3">Utilisateur: {this.state.selectedUser&&this.state.selectedUser.name}</h4>
                                    <div className="form-group">
                                            <DatePicker showTimeSelect placeholder="Date limite de validité" dateFormat="Pp" className="form-control" selected={this.state.date} onChange={date => this.pickDate(date)} />
                                        </div>
                                    <button onClick={() => this.sanctionUser()} className="btn btn-dark btn-md">{sanctioning ? <Loader />:"Sanctionner"}</button>
                                </div>
                            </div>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <div className="py-3">
                            <Button variant="danger" onClick={() => this.setState({showModal: !this.state.showModal})}>
                                Fermer
                            </Button>
                        </div>
                    </Modal.Footer>
                </Modal>
            </Hoc>
        );
    }
}

export default AdminUser;